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
    PointerEventTypes,
    Ray,
    MeshBuilder,
    StandardMaterial
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


        // --- WebXR Canonical Setup (Following Official BabylonJS Documentation) ---
        try {
            // 1. Initialize Default Experience with proper Quest controller configuration
            const xr = await sceneInstance.createDefaultXRExperienceAsync({
                floorMeshes: [], // No floor meshes - we use free-flight locomotion
                disableTeleportation: true, // We use custom free-flight
                disableHandTracking: true,
                // Input options for Quest controllers
                inputOptions: {
                    doNotLoadControllerMeshes: false, // Load controller meshes
                },
                // Pointer selection options
                pointerSelectionOptions: {
                    enablePointerSelectionOnAllControllers: true,
                    forceGazeMode: false, // Use controller ray, not gaze
                    gazeCamera: undefined,
                },
                uiOptions: {
                    sessionMode: 'immersive-vr',
                }
            });

            // 2. Validate XR initialization (per documentation)
            if (!xr.baseExperience) {
                console.error("WebXR not supported or failed to initialize");
                return;
            }
            xrHelperRef.current = xr;
            console.log("WebXR Default Experience initialized successfully");

            // 3. Configure Pointer Selection (uses auto-initialized feature from Default Helper)
            // Documentation: "The default experience initializes both pointer selection and teleportation automatically"
            if (xr.pointerSelection) {
                xr.pointerSelection.displayLaserPointer = true;
                xr.pointerSelection.displaySelectionMesh = true;
                xr.pointerSelection.selectionMeshDefaultColor = new Color3(0, 1, 0); // Green Cursor
                xr.pointerSelection.laserPointerDefaultColor = new Color3(0, 1, 0); // Green Beam
                console.log("WebXR Pointer Selection configured:", {
                    displayLaserPointer: xr.pointerSelection.displayLaserPointer,
                    displaySelectionMesh: xr.pointerSelection.displaySelectionMesh
                });
            } else {
                console.warn("WebXR Pointer Selection not available - check console for errors");
            }

            // 4. Standard Event Handling (PointerObservable)
            sceneInstance.onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                    const pickedMesh = pointerInfo.pickInfo?.pickedMesh as Mesh | InstancedMesh;

                    if (pickedMesh && pickedMesh.metadata) {
                        if (pickedMesh.metadata.type === 'node' || pickedMesh.metadata.type === 'edge') {
                            console.log("XR Interaction: POINTERDOWN on", pickedMesh.metadata.type, pickedMesh.metadata.id);
                            // Trigger Details Panel
                            detailsPanelRef.current.create(sceneInstance, pickedMesh.metadata, pickedMesh.metadata.type, xr);
                        }
                    }
                    // Only log if we picked something (avoid undefined spam)
                    // else if (pickedMesh) {
                    //     console.log("XR: Picked non-interactive mesh:", pickedMesh.name);
                    // }
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
                console.log("🎮 Controller added:", controller.inputSource.handedness, {
                    targetRayMode: controller.inputSource.targetRayMode,
                    profiles: controller.inputSource.profiles
                });

                // Create visible laser beam mesh for this controller
                const laserMaterial = new StandardMaterial(`laser-mat-${controller.inputSource.handedness}`, sceneInstance);
                laserMaterial.emissiveColor = new Color3(0, 1, 0.5); // Cyan/green glow
                laserMaterial.disableLighting = true;
                laserMaterial.alpha = 0.6;

                const laserMesh = MeshBuilder.CreateCylinder(`laser-${controller.inputSource.handedness}`, {
                    height: 50,
                    diameterTop: 0.005,
                    diameterBottom: 0.01
                }, sceneInstance);
                laserMesh.material = laserMaterial;
                laserMesh.isPickable = false;
                laserMesh.setEnabled(false); // Start hidden

                // Update laser position/rotation each frame
                sceneInstance.onBeforeRenderObservable.add(() => {
                    if (!xr.baseExperience || xr.baseExperience.state !== WebXRState.IN_XR) {
                        laserMesh.setEnabled(false);
                        return;
                    }

                    if (controller.pointer) {
                        laserMesh.setEnabled(true);
                        // Position at controller pointer
                        laserMesh.position = controller.pointer.position.clone();
                        // Add forward offset (laser extends forward)
                        const forward = controller.pointer.forward.scale(25);
                        laserMesh.position.addInPlace(forward);
                        // Match rotation to pointer
                        laserMesh.rotationQuaternion = controller.pointer.rotationQuaternion?.clone() ?? null;
                        // Rotate 90° to align cylinder with forward direction  
                        if (laserMesh.rotationQuaternion) {
                            laserMesh.rotationQuaternion.multiplyInPlace(Quaternion.RotationAxis(Vector3.Right(), Math.PI / 2));
                        }
                    }
                });

                controller.onMotionControllerInitObservable.add((motionController) => {
                    console.log("🕹️ Motion Controller initialized:", motionController.handedness, {
                        profileId: motionController.profileId,
                        componentIds: motionController.getComponentIds()
                    });

                    const ids = motionController.getComponentIds();

                    // Trigger for selection (per article: use trigger button for picking)
                    const triggerId = ids.find((id: string) => id.includes('trigger'));
                    if (triggerId) {
                        const trigger = motionController.getComponent(triggerId);
                        if (trigger) {
                            trigger.onButtonStateChangedObservable.add(() => {
                                // Only trigger when pressed > 80%
                                if (trigger.pressed && trigger.value > 0.8) {
                                    // Create ray from controller pointer
                                    const origin = controller.pointer.position;
                                    const direction = controller.pointer.forward;
                                    const ray = new Ray(origin, direction, 100);

                                    const hit = sceneInstance.pickWithRay(ray);
                                    if (hit && hit.hit && hit.pickedMesh) {
                                        const mesh = hit.pickedMesh as Mesh | InstancedMesh;
                                        if (mesh.metadata && (mesh.metadata.type === 'node' || mesh.metadata.type === 'edge')) {
                                            console.log("🎯 Trigger hit:", mesh.metadata.type, mesh.metadata.id);
                                            detailsPanelRef.current.create(sceneInstance, mesh.metadata, mesh.metadata.type, xr);
                                        }
                                    }
                                }
                            });
                        }
                    }

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
