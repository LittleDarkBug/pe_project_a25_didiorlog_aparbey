'use client';

import { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
    Vector3,
    Scene,
    ArcRotateCamera,
    Mesh,
    InstancedMesh,
    WebXRState,


    Quaternion,
    Ray,
    WebXRFeatureName,
    WebXRControllerPointerSelection,
    Color3
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // Required for controller models
import SceneComponent from '@/app/components/3DandXRComponents/Scene/SceneComponent';
import { useVRMenu } from '../hooks/useVRMenu';
import { VRDetailsPanel } from '../components/VRDetailsPanel';
import { GraphRenderer } from '../utils/GraphRenderer';
import { setupCommonScene } from '../utils/SceneSetup';
import { useJobPolling } from '@/app/hooks/useJobPolling';
import { apiClient } from '@/app/lib/apiClient';

interface GraphData {
    nodes: Array<{
        id: string;
        x: number;
        y: number;
        z: number;
        label?: string;
        color?: string;
        [key: string]: any;
    }>;
    edges: Array<{
        source: string;
        target: string;
        weight?: number;
        [key: string]: any;
    }>;
}

interface GraphSceneProps {
    data: GraphData;
    onSelect?: (data: any, type: 'node' | 'edge' | null) => void;
    visibleNodeIds?: Set<string> | null;
    projectId?: string;
    onLayoutUpdate?: (newData: any) => void;
}

export interface GraphSceneRef {
    resetCamera: () => void;
}

const GraphSceneXR = forwardRef<GraphSceneRef, GraphSceneProps>(({ data, onSelect, visibleNodeIds, projectId, onLayoutUpdate }, ref) => {
    const [scene, setScene] = useState<Scene | null>(null);
    const [isSceneReady, setIsSceneReady] = useState(false);
    const xrHelperRef = useRef<any>(null);
    const detailsPanelRef = useRef(new VRDetailsPanel());
    const nodeMeshesRef = useRef<Map<string, Mesh | InstancedMesh>>(new Map());
    const graphRenderer = useRef(new GraphRenderer());
    const vrMenuRef = useRef<Mesh | null>(null);

    // --- Async Layout Handling ---
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    // Polling inside GraphSceneXR (since VR user triggers it here)
    useJobPolling(currentJobId, {
        onSuccess: (result) => {
            const graphData = result.graph_data || result;
            if (onLayoutUpdate) {
                onLayoutUpdate(graphData);
            }
            setCurrentJobId(null);
            console.log("VR Layout Update Success");
        },
        onError: (error) => {
            console.error("VR Layout Update Error:", error);
            setCurrentJobId(null);
        }
    });

    const handleLayoutRequest = useCallback(async (algorithm: string) => {
        if (!projectId) return;
        try {
            console.log("Requesting layout from VR:", algorithm);
            const response = await apiClient.post<{ job_id?: string, graph_data?: any }>(`/projects/${projectId}/layout`, { algorithm });

            if (response.job_id) {
                setCurrentJobId(response.job_id);
            } else if (response.graph_data && onLayoutUpdate) {
                onLayoutUpdate(response.graph_data);
            }
        } catch (err) {
            console.error("Failed to request layout from VR", err);
        }
    }, [projectId, onLayoutUpdate]);


    useImperativeHandle(ref, () => ({
        resetCamera: () => {
            // In XR, resetting camera might mean teleporting user back to start
            if (xrHelperRef.current && xrHelperRef.current.baseExperience) {
                xrHelperRef.current.baseExperience.camera.position.set(0, 0, 0);
            } else if (scene) {
                const camera = scene.getCameraByName("camera") as ArcRotateCamera;
                if (camera) {
                    camera.setTarget(Vector3.Zero());
                    camera.alpha = -Math.PI / 2;
                    camera.beta = Math.PI / 2.5;
                    camera.radius = 100;
                }
            }
        }
    }));

    const { createVRMenu } = useVRMenu();

    // Store latest callback in ref to avoid recreating menu constantly
    const vrUtilsRef = useRef({ createVRMenu, handleLayoutRequest });
    useEffect(() => {
        vrUtilsRef.current = { createVRMenu, handleLayoutRequest };
    }, [createVRMenu, handleLayoutRequest]);

    // Handle visibility updates
    useEffect(() => {
        if (scene && nodeMeshesRef.current.size > 0) {
            graphRenderer.current.updateVisibility(visibleNodeIds ?? null, nodeMeshesRef.current);
        }
    }, [visibleNodeIds, scene]);

    const onSceneReady = useCallback(async (sceneInstance: Scene) => {
        setScene(sceneInstance);

        // Common Setup
        await setupCommonScene(sceneInstance);

        // Basic Camera for non-VR view (Preview)
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 100, Vector3.Zero(), sceneInstance);
        const canvas = sceneInstance.getEngine().getRenderingCanvas();
        camera.attachControl(canvas, true);

        // Camera Optimization
        camera.wheelPrecision = 10;
        camera.pinchPrecision = 10;
        camera.panningSensibility = 20;
        camera.wheelDeltaPercentage = 0.05;
        camera.lowerRadiusLimit = 0.1;
        camera.upperRadiusLimit = 10000;
        camera.inertia = 0.9;
        camera.angularSensibilityX = 800;
        camera.angularSensibilityY = 800;

        // Prevent page zoom
        if (canvas) {
            const preventZoom = (e: WheelEvent) => {
                if (e.ctrlKey || e.metaKey) e.preventDefault();
            };
            const preventTouchZoom = (e: TouchEvent) => {
                if (e.touches.length > 1) e.preventDefault();
            };
            canvas.addEventListener('wheel', preventZoom, { passive: false });
            canvas.addEventListener('touchmove', preventTouchZoom, { passive: false });
        }


        // WebXR Setup
        try {
            const xr = await sceneInstance.createDefaultXRExperienceAsync({
                floorMeshes: [], // Space mode
                disableTeleportation: true, // Custom locomotion
                disableHandTracking: true,
                disablePointerSelection: false, // Enable standard pointer selection
                uiOptions: {
                    sessionMode: 'immersive-vr',
                },
                pointerSelectionOptions: {
                    enablePointerSelectionOnAllControllers: true // Enable for both hands
                }
            });
            xrHelperRef.current = xr;

            // --- ENSURE POINTERS ARE VISIBLE ---
            try {
                // Get the feature that was automatically enabled by createDefaultXRExperienceAsync
                const pointerSelection = xr.baseExperience.featuresManager.getEnabledFeature(WebXRFeatureName.POINTER_SELECTION) as WebXRControllerPointerSelection;

                if (pointerSelection) {
                    pointerSelection.displayLaserPointer = true; // Always show laser
                    pointerSelection.selectionMeshDefaultColor = new Color3(0, 1, 0); // Green laser

                    // Explicitly allow selection on all controllers (redundant with options, but safe)
                    // Note: enablePointerSelectionOnAllControllers is a creation-time option, 
                    // but we can ensure the feature is active.
                    console.log("VR Pointer Selection Feature Found and Configured");
                } else {
                    console.error("VR Pointer Selection Feature NOT found!");
                }
            } catch (e) {
                console.error("Error configuring VR pointers:", e);
            }

            // Listen to XR state
            xr.baseExperience.onStateChangedObservable.add((state: WebXRState) => {
                if (state === WebXRState.IN_XR) {
                    console.log("VR started - Checking Pointers");
                }
            });

            // --- STANDARD SELECTION HANDLING (POINTER OBSERVABLE) ---
            sceneInstance.onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.type === 1) { // POINTERDOWN
                    const pickedMesh = pointerInfo.pickInfo?.pickedMesh as Mesh | InstancedMesh;
                    // Check if it's a node or edge
                    if (pickedMesh && pickedMesh.metadata && (pickedMesh.metadata.type === 'node' || pickedMesh.metadata.type === 'edge')) {
                        console.log("XR Select:", pickedMesh.metadata.type, pickedMesh.metadata);
                        detailsPanelRef.current.create(sceneInstance, pickedMesh.metadata, pickedMesh.metadata.type, xr, pickedMesh);
                    }
                }
            });

            // --- XR Controller Inputs (Menu & Locomotion) ---
            xr.input.onControllerAddedObservable.add((controller) => {
                controller.onMotionControllerInitObservable.add((motionController) => {
                    const ids = motionController.getComponentIds();

                    // 1. Menu Toggle (A / X)
                    const primaryId = ids.find(id => id === 'a-button' || id === 'x-button');
                    if (primaryId) {
                        const primaryButton = motionController.getComponent(primaryId);
                        if (primaryButton) {
                            primaryButton.onButtonStateChangedObservable.add(() => {
                                if (primaryButton.changes.pressed && primaryButton.pressed) {
                                    if (vrMenuRef.current) {
                                        vrMenuRef.current.dispose();
                                        vrMenuRef.current = null;
                                    } else {
                                        vrMenuRef.current = vrUtilsRef.current.createVRMenu(sceneInstance, xr, vrUtilsRef.current.handleLayoutRequest);
                                    }
                                }
                            });
                        }
                    }
                });
            });

            // --- Render Loop (Locomotion) ---
            const speed = 0.5;
            const rotationSpeed = 0.05;
            sceneInstance.onBeforeRenderObservable.add(() => {
                if (!xr.baseExperience || xr.baseExperience.state !== WebXRState.IN_XR) return;

                xr.input.controllers.forEach((controller) => {
                    if (controller.motionController) {
                        const thumbstick = controller.motionController.getComponent("xr-standard-thumbstick");
                        if (thumbstick) {
                            const axes = thumbstick.axes;
                            if (Math.abs(axes.x) < 0.1 && Math.abs(axes.y) < 0.1) return; // Deadzone

                            const camera = xr.baseExperience.camera;
                            // Movement Layer (Left Hand)
                            if (controller.inputSource.handedness === 'left') {
                                const forward = camera.getForwardRay().direction;
                                const right = camera.getDirection(Vector3.Right());

                                const moveDir = forward.scale(-axes.y * speed);
                                moveDir.addInPlace(right.scale(axes.x * speed));

                                camera.position.addInPlace(moveDir);
                            }
                            // Right Hand: Rotate
                            else if (controller.inputSource.handedness === 'right') {
                                if (Math.abs(axes.x) > 0.5) {
                                    camera.rotationQuaternion.multiplyInPlace(Quaternion.RotationAxis(Vector3.Up(), -axes.x * rotationSpeed));
                                }
                            }
                        }
                    }
                });
            });



        } catch (e) {
            console.log("WebXR not supported", e);
        }

        setIsSceneReady(true);
    }, []);

    // Handle graph data updates
    useEffect(() => {
        if (!scene || !data) return;

        // Clean up old graph
        graphRenderer.current.disposeGraph(nodeMeshesRef.current, scene);

        // Render graph
        graphRenderer.current.createNodes(
            data,
            scene,
            nodeMeshesRef.current,
            undefined, // Disable standard web selection in XR mode
            undefined, // Disable standard ActionManager selection (We use manual XR Ray)
            xrHelperRef
        );
        graphRenderer.current.createEdges(
            data,
            scene,
            nodeMeshesRef.current,
            undefined, // Disable standard web selection in XR mode
            undefined, // Disable standard ActionManager selection
            xrHelperRef
        );

        // Force visibility update
        graphRenderer.current.updateVisibility(visibleNodeIds ?? null, nodeMeshesRef.current);

    }, [scene, data, onSelect]);

    return (
        <div className="h-full w-full overflow-hidden rounded-xl bg-black/20 relative" style={{ touchAction: 'none' }}>
            {!isSceneReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                        <p className="text-sm text-gray-400">Chargement de la scène VR...</p>
                    </div>
                </div>
            )}
            <SceneComponent
                antialias
                onSceneReady={onSceneReady}
                id="graph-canvas-xr"
                className="h-full w-full outline-none"
                style={{ touchAction: 'none' }}
            />
        </div>
    );
});

GraphSceneXR.displayName = 'GraphSceneXR';

export default GraphSceneXR;
