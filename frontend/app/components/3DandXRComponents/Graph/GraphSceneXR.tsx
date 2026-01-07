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
    WebXRMotionControllerManager
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


        // --- WebXR Setup (Using manual rays per article, native pointer disabled) ---
        try {
            // Configure to use local controller models (Oculus Touch) instead of online repository
            // This fixes issues where online repository models don't load
            WebXRMotionControllerManager.PrioritizeOnlineRepository = false;
            console.log("🎮 Using local controller models (PrioritizeOnlineRepository = false)");

            // 1. Initialize Default Experience
            const xr = await sceneInstance.createDefaultXRExperienceAsync({
                floorMeshes: [], // No floor meshes - we use free-flight locomotion
                disableTeleportation: true, // We use custom free-flight
                disableHandTracking: true,
                disablePointerSelection: true, // Disabled - we build rays manually per article
                inputOptions: {
                    doNotLoadControllerMeshes: false, // Load controller meshes
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
            console.log("WebXR initialized - using manual ray picking");

            // Note: Native pointerSelection disabled, we use manual rays per article

            // 5. XR State Management - Notify parent of state changes
            xr.baseExperience.onStateChangedObservable.add((state: WebXRState) => {
                if (state === WebXRState.IN_XR) {
                    console.log("VR Experience Started - Features Configured");

                    // DEBUG: Create test sphere at fixed position to verify rendering
                    const testSphere = MeshBuilder.CreateSphere("debug-sphere", { diameter: 0.5 }, sceneInstance);
                    testSphere.position = new Vector3(0, 1.5, -2); // 2m in front, at head height
                    const testMat = new StandardMaterial("debug-mat", sceneInstance);
                    testMat.emissiveColor = new Color3(1, 0, 0); // BRIGHT RED
                    testMat.disableLighting = true;
                    testSphere.material = testMat;
                    console.log("🔴 DEBUG: Created red test sphere at (0, 1.5, -2)");

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
                    profiles: controller.inputSource.profiles,
                    hasGrip: !!controller.grip,
                    hasPointer: !!controller.pointer
                });

                // Debug: Check if controller meshes are loaded
                if (controller.grip) {
                    console.log("📦 Grip mesh children:", controller.grip.getChildMeshes().length);

                    // Create custom controller visual since external models don't load
                    const controllerVisual = MeshBuilder.CreateBox(
                        `controller-visual-${controller.inputSource.handedness}`,
                        { width: 0.05, height: 0.03, depth: 0.15 },
                        sceneInstance
                    );
                    const controllerMat = new StandardMaterial(`controller-mat-${controller.inputSource.handedness}`, sceneInstance);
                    controllerMat.emissiveColor = new Color3(0.2, 0.8, 1); // Cyan glow
                    controllerMat.diffuseColor = new Color3(0.2, 0.8, 1);
                    controllerMat.disableLighting = true;
                    controllerVisual.material = controllerMat;
                    controllerVisual.isPickable = false;
                    controllerVisual.isVisible = false; // Start hidden

                    // Update position in render loop (like laser) instead of parenting
                    let posLogged = false;
                    sceneInstance.onBeforeRenderObservable.add(() => {
                        if (!xr.baseExperience || xr.baseExperience.state !== WebXRState.IN_XR) {
                            controllerVisual.isVisible = false;
                            return;
                        }
                        if (controller.grip) {
                            controllerVisual.isVisible = true;
                            controllerVisual.position.copyFrom(controller.grip.position);
                            controllerVisual.rotationQuaternion = controller.grip.rotationQuaternion?.clone() ?? null;

                            if (!posLogged) {
                                console.log("📍 Controller visual position:", controller.inputSource.handedness, controllerVisual.position.toString());
                                posLogged = true;
                            }
                        }
                    });

                    console.log("✅ Created custom controller visual for:", controller.inputSource.handedness);
                }
                if (controller.pointer) {
                    console.log("📦 Pointer mesh children:", controller.pointer.getChildMeshes().length);
                }

                // Create visible laser beam mesh for this controller
                const laserMaterial = new StandardMaterial(`laser-mat-${controller.inputSource.handedness}`, sceneInstance);
                laserMaterial.emissiveColor = new Color3(0, 1, 0); // Bright green
                laserMaterial.diffuseColor = new Color3(0, 1, 0);
                laserMaterial.disableLighting = true;
                laserMaterial.alpha = 1.0; // Fully opaque

                // MUCH thicker laser for visibility
                const laserMesh = MeshBuilder.CreateCylinder(`laser-${controller.inputSource.handedness}`, {
                    height: 10, // 10 meter long
                    diameterTop: 0.01,
                    diameterBottom: 0.02 // 2cm thick at base
                }, sceneInstance);
                laserMesh.material = laserMaterial;
                laserMesh.isPickable = false;
                laserMesh.renderingGroupId = 1; // Render in front of other objects

                // Update laser position/rotation each frame
                let laserDebugLogged = false;
                sceneInstance.onBeforeRenderObservable.add(() => {
                    if (!xr.baseExperience || xr.baseExperience.state !== WebXRState.IN_XR) {
                        laserMesh.isVisible = false;
                        return;
                    }

                    // Debug controller.pointer availability once
                    if (!laserDebugLogged) {
                        console.log("📍 Controller state:", controller.inputSource.handedness, {
                            hasPointer: !!controller.pointer,
                            hasGrip: !!controller.grip
                        });
                        laserDebugLogged = true;
                    }

                    // Use pointer if available, fallback to grip
                    const pointerTransform = controller.pointer || controller.grip;
                    if (pointerTransform) {
                        laserMesh.isVisible = true;

                        // Position: start at controller, extend forward
                        // Cylinder center should be 5m forward (half of 10m length)
                        const origin = pointerTransform.position.clone();
                        const forward = pointerTransform.forward.clone();
                        laserMesh.position = origin.add(forward.scale(5)); // Center at 5m forward

                        // Rotation: align cylinder with forward direction
                        const up = Vector3.Up();
                        const rotationMatrix = new Quaternion();
                        Quaternion.FromUnitVectorsToRef(up, forward, rotationMatrix);
                        laserMesh.rotationQuaternion = rotationMatrix;

                        if (!laserDebugLogged) {
                            console.log("🔦 Laser visible at:", laserMesh.position.toString());
                        }
                    } else {
                        laserMesh.isVisible = false;
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
                            let lastTriggerTime = 0;
                            const DEBOUNCE_MS = 300;

                            trigger.onButtonStateChangedObservable.add(() => {
                                // Only fire on press start (not hold), with debounce
                                const now = Date.now();
                                if (trigger.changes.pressed && trigger.pressed && trigger.value > 0.8 && (now - lastTriggerTime > DEBOUNCE_MS)) {
                                    lastTriggerTime = now;

                                    // Use pointer if available, fallback to grip
                                    const pointerTransform = controller.pointer || controller.grip;
                                    if (!pointerTransform) {
                                        console.warn("⚠️ No pointer/grip available for picking");
                                        return;
                                    }

                                    // Create ray from controller
                                    const origin = pointerTransform.position;
                                    const direction = pointerTransform.forward;
                                    const ray = new Ray(origin, direction, 100);

                                    const hit = sceneInstance.pickWithRay(ray);
                                    if (hit && hit.hit && hit.pickedMesh) {
                                        const mesh = hit.pickedMesh as Mesh | InstancedMesh;

                                        // Check for node/edge (graph elements)
                                        if (mesh.metadata && (mesh.metadata.type === 'node' || mesh.metadata.type === 'edge')) {
                                            const itemId = mesh.metadata.id || `${mesh.metadata.source}->${mesh.metadata.target}`;
                                            console.log("🎯 Trigger hit:", mesh.metadata.type, itemId);
                                            detailsPanelRef.current.create(sceneInstance, mesh.metadata, mesh.metadata.type, xr);
                                        }
                                        // Check for GUI mesh (menus, panels) - simulate pointer events
                                        else if (hit.pickedPoint) {
                                            // Simulate pointer click for GUI elements
                                            sceneInstance.simulatePointerDown(hit);
                                            setTimeout(() => {
                                                sceneInstance.simulatePointerUp(hit);
                                            }, 50);
                                            console.log("🖱️ GUI click simulated on:", mesh.name);
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
