'use client';

import { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
    Vector3,
    Scene,
    ArcRotateCamera,
    Mesh,
    InstancedMesh
} from '@babylonjs/core';
import SceneComponent from '@/app/components/3DandXRComponents/Scene/SceneComponent';
import { useVRMenu } from '../hooks/useVRMenu';
import { useVRLocomotion } from '../hooks/useVRLocomotion';
import { VRDetailsPanel } from '../components/VRDetailsPanel';
import { GraphRenderer } from '../utils/GraphRenderer';
import { setupCommonScene } from '../utils/SceneSetup';

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
}

export interface GraphSceneRef {
    resetCamera: () => void;
}

const GraphSceneXR = forwardRef<GraphSceneRef, GraphSceneProps>(({ data, onSelect, visibleNodeIds }, ref) => {
    const [scene, setScene] = useState<Scene | null>(null);
    const [isSceneReady, setIsSceneReady] = useState(false);
    const xrHelperRef = useRef<any>(null);
    const detailsPanelRef = useRef(new VRDetailsPanel());
    const nodeMeshesRef = useRef<Map<string, Mesh | InstancedMesh>>(new Map());
    const graphRenderer = useRef(new GraphRenderer());

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
    const { setupLocomotion } = useVRLocomotion();
    
    const vrUtilsRef = useRef({ createVRMenu, setupLocomotion });
    useEffect(() => {
        vrUtilsRef.current = { createVRMenu, setupLocomotion };
    });

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

        // Basic Camera for non-VR view (Preview) - Same config as Web for consistency
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 100, Vector3.Zero(), sceneInstance);
        const canvas = sceneInstance.getEngine().getRenderingCanvas();
        camera.attachControl(canvas, true);
        
        // Camera Optimization (Matches GraphSceneWeb)
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
                floorMeshes: [], // We are in space, no floor
                disableTeleportation: true, // We use custom locomotion
                disableHandTracking: true, // Désactive le hand tracking pour éviter l'erreur
                uiOptions: {
                    sessionMode: 'immersive-vr',
                    optionalFeatures: ['unbounded', 'local-floor'] // Retire 'hand-tracking'
                }
            });
            xrHelperRef.current = xr;


            // Activation du flying (movement) et du pointer selection selon la doc Babylon.js v8
            const featuresManager = xr.baseExperience.featuresManager;
            // Flying (movement)
            featuresManager.enableFeature(
                BABYLON.WebXRFeatureName.MOVEMENT,
                'latest',
                {
                    xrInput: xr.input,
                    movementSpeed: 20.0,
                    rotationSpeed: 0.5,
                    movementOrientationFollowsViewerPose: true,
                    enablePhysics: false,
                    allowVerticalMovement: true,
                    allowHorizontalMovement: true,
                    movementMode: 'flying',
                }
            );
            // Pointer Selection (laser)
            featuresManager.enableFeature(
                BABYLON.WebXRFeatureName.POINTER_SELECTION,
                'latest',
                {
                    xrInput: xr.input,
                    enablePointerSelectionOnAllControllers: true,
                    displayLaserPointer: true,
                    selectionMeshPickedPointEnabled: true,
                }
            );

            xr.baseExperience.onStateChangedObservable.add((state) => {
                if (state === 2) { // IN_XR
                    console.log("VR started");
                    vrUtilsRef.current.createVRMenu(sceneInstance, xr);
                }
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
            (nodeData, type) => detailsPanelRef.current.create(scene, nodeData, type), // VR Select
            xrHelperRef
        );
        graphRenderer.current.createEdges(
            data,
            scene,
            nodeMeshesRef.current,
            undefined, // Disable standard web selection in XR mode
            (edgeData, type) => detailsPanelRef.current.create(scene, edgeData, type),
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
