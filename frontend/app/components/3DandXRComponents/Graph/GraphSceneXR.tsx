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
    WebXRFeatureName,
    WebXRControllerPointerSelection,
    Color3,
    PointerEventTypes
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
    onXRStateChange?: (isInXR: boolean) => void;
}

export interface GraphSceneRef {
    resetCamera: () => void;
}

const GraphSceneXR = forwardRef<GraphSceneRef, GraphSceneProps>(({ data, onSelect, visibleNodeIds, projectId, onLayoutUpdate, onXRStateChange }, ref) => {
    const [scene, setScene] = useState<Scene | null>(null);
    const [isSceneReady, setIsSceneReady] = useState(false);
    const xrHelperRef = useRef<any>(null);
    const detailsPanelRef = useRef(new VRDetailsPanel());
    const nodeMeshesRef = useRef<Map<string, Mesh | InstancedMesh>>(new Map());
    const graphRenderer = useRef(new GraphRenderer());
    const vrMenuRef = useRef<Mesh | null>(null);

    // --- Async Layout Handling ---
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

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
    const vrUtilsRef = useRef({ createVRMenu, handleLayoutRequest, onXRStateChange });
    useEffect(() => {
        vrUtilsRef.current = { createVRMenu, handleLayoutRequest, onXRStateChange };
    }, [createVRMenu, handleLayoutRequest, onXRStateChange]);

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
        camera.lowerRadiusLimit = 0.1;
        camera.upperRadiusLimit = 10000;

        // Prevent page zoom
        if (canvas) {
            const preventZoom = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
            canvas.addEventListener('wheel', preventZoom, { passive: false });
        }


        // --- WebXR Canonical Setup ---
        try {
            // 1. Initialize Experience
            const xr = await sceneInstance.createDefaultXRExperienceAsync({
                floorMeshes: [], // Space mode
                disableTeleportation: true, // We use custom free-flight
                disableHandTracking: true,
                disablePointerSelection: false, // Enable default to ensure standard wiring
                uiOptions: {
                    sessionMode: 'immersive-vr',
                }
            });
            xrHelperRef.current = xr;

            // 2. Configure Pointers (The "Right" Way via FeaturesManager)
            const featureManager = xr.baseExperience.featuresManager;

            // Retrieve the automatically enabled feature
            const pointerSelection = featureManager.getEnabledFeature(WebXRFeatureName.POINTER_SELECTION) as WebXRControllerPointerSelection;

            // 3. Visual Configuration
            // Ensure lasers are visible and colored correctly
            pointerSelection.displayLaserPointer = true;
            pointerSelection.selectionMeshDefaultColor = new Color3(0, 1, 0); // Green Cursor
            pointerSelection.laserPointerDefaultColor = new Color3(0, 1, 0); // Green Beam

            // 4. Standard Event Handling (PointerObservable)
            sceneInstance.onPointerObservable.add((pointerInfo) => {
                switch (pointerInfo.type) {
                    case PointerEventTypes.POINTERDOWN:
                        // Check if we hit a mesh with metadata (Node or Edge)
                        const pickedMesh = pointerInfo.pickInfo?.pickedMesh as Mesh | InstancedMesh;
                        if (pickedMesh && pickedMesh.metadata && (pickedMesh.metadata.type === 'node' || pickedMesh.metadata.type === 'edge')) {
                            console.log("XR Interaction: POINTERDOWN on", pickedMesh.metadata.id);
                            // Trigger Details Panel
                            detailsPanelRef.current.create(sceneInstance, pickedMesh.metadata, pickedMesh.metadata.type, xr);
                        }
                        break;
                }
            });

            // 5. XR State Management - Notify parent of state changes
            xr.baseExperience.onStateChangedObservable.add((state: WebXRState) => {
                if (state === WebXRState.IN_XR) {
                    console.log("VR Experience Started - Features Configured");
                    // Notify parent that we're now in XR
                    if (vrUtilsRef.current.onXRStateChange) {
                        vrUtilsRef.current.onXRStateChange(true);
                    }
                } else if (state === WebXRState.EXITING_XR) {
                    console.log("VR Experience Ending");
                    // Notify parent that we're leaving XR
                    if (vrUtilsRef.current.onXRStateChange) {
                        vrUtilsRef.current.onXRStateChange(false);
                    }
                }
            });

            // 6. Custom Controller Logic (Menu & Locomotion)
            // This is additive and does not conflict with standard features
            xr.input.onControllerAddedObservable.add((controller) => {
                controller.onMotionControllerInitObservable.add((motionController) => {
                    const ids = motionController.getComponentIds();

                    // Menu Toggle (A / X)
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

            // Locomotion Loop (Free Flight)
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
                            // Movement (Left Hand)
                            if (controller.inputSource.handedness === 'left') {
                                const forward = camera.getForwardRay().direction;
                                const right = camera.getDirection(Vector3.Right());
                                const moveDir = forward.scale(-axes.y * speed);
                                moveDir.addInPlace(right.scale(axes.x * speed));
                                camera.position.addInPlace(moveDir);
                            }
                            // Rotation (Right Hand)
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
            console.error("WebXR Initialization Failed:", e);
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
            undefined, // No web selection
            undefined,
            xrHelperRef,
            true // skip2DUI: ESSENTIAL for VR picking
        );
        graphRenderer.current.createEdges(
            data,
            scene,
            nodeMeshesRef.current,
            undefined,
            undefined,
            xrHelperRef
        );

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
