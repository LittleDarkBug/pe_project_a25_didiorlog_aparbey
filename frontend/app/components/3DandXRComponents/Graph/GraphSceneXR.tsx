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
    Color3,
    Ray,
    MeshBuilder,
    StandardMaterial,
    WebXRMotionControllerManager,
    WebXRFeatureName
} from '@babylonjs/core';
import '@babylonjs/core/XR/motionController/webXROculusTouchMotionController'; // Local Oculus Touch controller
import '@babylonjs/loaders'; // Required for glTF controller models
import '@babylonjs/core/Materials/Node/Blocks'; // Required for NodeMaterial in controller models
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
    showLabels?: boolean;
    onResetFilters?: () => void;
    onToggleLabels?: () => void;
}

export interface GraphSceneRef {
    resetCamera: () => void;
}

const GraphSceneXR = forwardRef<GraphSceneRef, GraphSceneProps>(({ data, onSelect, visibleNodeIds, projectId, onLayoutUpdate, onXRStateChange, showLabels, onResetFilters, onToggleLabels }, ref) => {
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
    const vrUtilsRef = useRef({ createVRMenu, handleLayoutRequest, onXRStateChange, onResetFilters, onToggleLabels });
    useEffect(() => {
        vrUtilsRef.current = { createVRMenu, handleLayoutRequest, onXRStateChange, onResetFilters, onToggleLabels };
    }, [createVRMenu, handleLayoutRequest, onXRStateChange, onResetFilters, onToggleLabels]);

    // Handle visibility updates
    useEffect(() => {
        if (scene && nodeMeshesRef.current.size > 0) {
            graphRenderer.current.updateVisibility(visibleNodeIds ?? null, nodeMeshesRef.current);
        }
    }, [visibleNodeIds, scene]);

    // Handle Label Visibility
    useEffect(() => {
        if (scene && nodeMeshesRef.current.size > 0) {
            graphRenderer.current.updateLabelVisibility(!!showLabels, nodeMeshesRef.current, scene);
        }
    }, [showLabels, scene]);

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


        // --- WebXR Setup (Using manual rays per article, native pointer disabled) ---
        try {
            // Configure to use local controller models (Oculus Touch) instead of online repository
            // This fixes issues where online repository models don't load
            WebXRMotionControllerManager.PrioritizeOnlineRepository = false;
            console.log("🎮 Using local controller models (PrioritizeOnlineRepository = false)");

            // 1. Initialize Default Experience
            const xr = await sceneInstance.createDefaultXRExperienceAsync({
                floorMeshes: [],
                disableTeleportation: true, // Disable teleport for Free Fly
                inputOptions: {
                    doNotLoadControllerMeshes: false,
                },
                uiOptions: {
                    sessionMode: 'immersive-vr',
                }
            });

            // 2. Validate XR initialization
            if (!xr.baseExperience) {
                console.error("WebXR not supported or failed to initialize");
                return;
            }

            xrHelperRef.current = xr;
            console.log("WebXR initialized - using standard pointers");

            // 5. XR State Management
            xr.baseExperience.onStateChangedObservable.add((state: WebXRState) => {
                if (state === WebXRState.IN_XR) {
                    console.log("VR Experience Started");
                    if (vrUtilsRef.current.onXRStateChange) {
                        vrUtilsRef.current.onXRStateChange(true);
                    }
                } else if (state === WebXRState.EXITING_XR) {
                    console.log("VR Experience Ending");
                    if (vrUtilsRef.current.onXRStateChange) {
                        vrUtilsRef.current.onXRStateChange(false);
                    }
                }
            });

            // 3. Setup Locomotion (Free Fly)
            const featuresManager = xr.baseExperience.featuresManager;
            try {
                const locomotion = featuresManager.enableFeature(
                    WebXRFeatureName.MOVEMENT,
                    'latest',
                    {
                        xrInput: xr.input,
                        movementOrientationFollowsViewerPose: false,
                        movementOrientationFollowsController: true, // Direction follows controller
                        movementSpeed: 0.5, // Reasonable speed
                        rotationSpeed: 0.5,
                        movementEnabled: true,
                        rotationEnabled: true, // Smooth rotation
                        movementThreshold: 0.05
                    }
                );
                console.log('[VR] Free Fly Locomotion enabled');
            } catch (error) {
                console.error('[VR] Error enabling locomotion:', error);
            }
            // 6. Simple Controller Interaction for Menu
            xr.input.onControllerAddedObservable.add((controller) => {
                controller.onMotionControllerInitObservable.add((motionController) => {
                    const ids = motionController.getComponentIds();
                    // Menu Toggle (A / X)
                    const primaryId = ids.find((id: string) => id === 'a-button' || id === 'x-button');
                    if (primaryId) {
                        const primaryButton = motionController.getComponent(primaryId);
                        if (primaryButton) {
                            primaryButton.onButtonStateChangedObservable.add(() => {
                                if (primaryButton.changes.pressed && primaryButton.pressed) {
                                    if (vrMenuRef.current) {
                                        vrMenuRef.current.dispose();
                                        vrMenuRef.current = null;
                                    } else {
                                        vrMenuRef.current = vrUtilsRef.current.createVRMenu(
                                            sceneInstance,
                                            xr,
                                            vrUtilsRef.current.handleLayoutRequest,
                                            vrUtilsRef.current.onResetFilters,
                                            vrUtilsRef.current.onToggleLabels
                                        );
                                    }
                                }
                            });
                        }
                    }
                });
            });

            // 5. Create Exit Door
            const createExitDoor = () => {
                const doorFrame = MeshBuilder.CreateBox('doorFrame', { width: 5, height: 8, depth: 0.5 }, sceneInstance);
                doorFrame.position = new Vector3(0, 4, -10); // Positioned visible to user (z -10)

                const frameMaterial = new StandardMaterial('frameMat', sceneInstance);
                frameMaterial.diffuseColor = new Color3(0.1, 0.1, 0.15);
                frameMaterial.emissiveColor = new Color3(0.05, 0.05, 0.1);
                doorFrame.material = frameMaterial;

                const door = MeshBuilder.CreateBox('exitDoor', { width: 4.5, height: 7.5, depth: 0.2 }, sceneInstance);
                door.position = doorFrame.position.clone();
                door.position.z += 0.3;

                const doorMaterial = new StandardMaterial('doorMat', sceneInstance);
                doorMaterial.diffuseColor = new Color3(0.2, 0.3, 0.5);
                doorMaterial.emissiveColor = new Color3(0.1, 0.2, 0.4);
                door.material = doorMaterial;

                // Simple action to exit VR
                sceneInstance.onPointerObservable.add((pointerInfo) => {
                    if (pointerInfo.type === 1) { // POINTERDOWN
                        if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh === door) {
                            console.log('[VR] Porte de sortie activée');
                            xr.baseExperience.exitXRAsync();
                        }
                    }
                });
            };

            // 5. XR State Management
            xr.baseExperience.onStateChangedObservable.add((state: WebXRState) => {
                if (state === WebXRState.IN_XR) {
                    console.log("VR Experience Started");
                    createExitDoor(); // Add door
                    if (vrUtilsRef.current.onXRStateChange) {
                        vrUtilsRef.current.onXRStateChange(true);
                    }
                } else if (state === WebXRState.EXITING_XR) {
                    console.log("VR Experience Ending");
                    // Cleanup door
                    const door = sceneInstance.getMeshByName("exitDoor");
                    const frame = sceneInstance.getMeshByName("doorFrame");
                    if (door) door.dispose();
                    if (frame) frame.dispose();

                    if (vrUtilsRef.current.onXRStateChange) {
                        vrUtilsRef.current.onXRStateChange(false);
                    }
                }
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

        // Define VR Selection Callback
        const handleVRSelect = (itemData: any, type: string) => {
            console.log("VR Selection Triggered:", itemData);
            if (detailsPanelRef.current) {
                detailsPanelRef.current.create(scene, itemData, type, xrHelperRef.current);
            }
        };

        // Render graph
        graphRenderer.current.createNodes(
            data,
            scene,
            nodeMeshesRef.current,
            onSelect, // Web Selection (still useful for monitor view)
            handleVRSelect, // VR Selection Callback (Fixed!)
            xrHelperRef,
            true // skip2DUI
        );
        graphRenderer.current.createEdges(
            data,
            scene,
            nodeMeshesRef.current,
            onSelect,
            handleVRSelect, // VR Selection Callback
            xrHelperRef
        );

        graphRenderer.current.updateVisibility(visibleNodeIds ?? null, nodeMeshesRef.current);
        // Pass isXR=true for label handling in VR (needs update in GraphRenderer)
        graphRenderer.current.updateLabelVisibility(!!showLabels, nodeMeshesRef.current, scene, true);
    }, [scene, data, onSelect, showLabels]);

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
