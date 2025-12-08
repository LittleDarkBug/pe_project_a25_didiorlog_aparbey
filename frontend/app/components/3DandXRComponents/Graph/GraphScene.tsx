'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import {
    Vector3,
    Color3,
    MeshBuilder,
    StandardMaterial,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Mesh,
    GlowLayer,
    InstancedMesh
} from '@babylonjs/core';
import SceneComponent from '@/app/components/3DandXRComponents/Scene/SceneComponent';
import { useVRMenu } from '../hooks/useVRMenu';
import { useVRLocomotion } from '../hooks/useVRLocomotion';
import { VRDetailsPanel } from '../components/VRDetailsPanel';
import { GraphRenderer } from '../utils/GraphRenderer';

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

export default function GraphScene({ data, onSelect, visibleNodeIds }: GraphSceneProps) {
    const [scene, setScene] = useState<Scene | null>(null);
    const xrHelperRef = useRef<any>(null);
    const detailsPanelRef = useRef(new VRDetailsPanel());
    const nodeMeshesRef = useRef<Map<string, Mesh | InstancedMesh>>(new Map());

    const { createVRMenu } = useVRMenu();
    const { setupLocomotion } = useVRLocomotion();
    
    // Use refs for VR hooks to keep onSceneReady stable
    const vrUtilsRef = useRef({ createVRMenu, setupLocomotion });
    useEffect(() => {
        vrUtilsRef.current = { createVRMenu, setupLocomotion };
    });

    const graphRenderer = useRef(new GraphRenderer());

    // Handle visibility updates
    useEffect(() => {
        if (scene && nodeMeshesRef.current.size > 0) {
            graphRenderer.current.updateVisibility(visibleNodeIds ?? null, nodeMeshesRef.current);
        }
    }, [visibleNodeIds, scene]);

    const onSceneReady = useCallback(async (sceneInstance: Scene) => {
        setScene(sceneInstance);

        // Scene setup
        sceneInstance.clearColor = new Color3(0.01, 0.01, 0.03).toColor4();

        // Camera setup
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 100, Vector3.Zero(), sceneInstance);
        const canvas = sceneInstance.getEngine().getRenderingCanvas();

        camera.attachControl(canvas, true);
        
        // OPTIMIZATION: Faster and smoother navigation
        camera.wheelPrecision = 10; // Lower = Faster zoom
        camera.pinchPrecision = 10; // Lower = Faster pinch
        camera.panningSensibility = 20; // Lower = Faster panning
        camera.wheelDeltaPercentage = 0.05; // 5% zoom per scroll (was 1%) - Makes zoom much faster on large scales
        
        camera.lowerRadiusLimit = 0.1; // Allow getting very close
        camera.upperRadiusLimit = 10000; // Allow seeing huge graphs
        
        camera.inertia = 0.9; // High inertia for fluid movement
        camera.angularSensibilityX = 800; // Faster rotation
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
            const container = canvas.parentElement;
            if (container) {
                container.addEventListener('wheel', preventZoom, { passive: false });
                container.addEventListener('touchmove', preventTouchZoom, { passive: false });
            }
        }

        // Lighting
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), sceneInstance);
        light.intensity = 0.4;
        light.diffuse = new Color3(0.9, 0.9, 1);
        light.specular = new Color3(1, 1, 1);
        light.groundColor = new Color3(0.05, 0.05, 0.1);

        const { DirectionalLight } = await import('@babylonjs/core');
        const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), sceneInstance);
        dirLight.intensity = 0.2;
        dirLight.diffuse = new Color3(0.8, 0.8, 0.9);

        // Space background
        const spaceSphere = MeshBuilder.CreateSphere("spaceSphere", { diameter: 1000 }, sceneInstance);
        const spaceMat = new StandardMaterial("spaceMat", sceneInstance);
        spaceMat.backFaceCulling = false;
        spaceMat.disableLighting = true;
        spaceMat.emissiveColor = new Color3(0.01, 0.02, 0.05);
        spaceSphere.material = spaceMat;

        // Stars
        const starMat = new StandardMaterial("starMat", sceneInstance);
        starMat.emissiveColor = new Color3(0.8, 0.8, 1);
        starMat.disableLighting = true;

        for (let i = 0; i < 200; i++) {
            const star = MeshBuilder.CreateSphere(`star_${i}`, { diameter: 0.3 }, sceneInstance);
            const radius = 300 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            star.position = new Vector3(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );

            const brightness = 0.3 + Math.random() * 0.7;
            const starMatClone = starMat.clone(`starMat_${i}`);
            starMatClone.emissiveColor = new Color3(brightness, brightness, brightness * 1.1);
            star.material = starMatClone;
        }

        const gl = new GlowLayer("glow", sceneInstance);
        gl.intensity = 0.5;

        // WebXR Setup
        try {
            const xr = await sceneInstance.createDefaultXRExperienceAsync({
                floorMeshes: [],
                disableTeleportation: true,
                disableHandTracking: true,  // Prevent hand tracking asset loading
                uiOptions: {
                    sessionMode: 'immersive-vr',
                    optionalFeatures: ['unbounded', 'local-floor']
                }
            });
            xrHelperRef.current = xr;

            const featuresManager = xr.baseExperience.featuresManager;
            // Use ref to access latest setupLocomotion without adding dependency
            vrUtilsRef.current.setupLocomotion(featuresManager, xr);

            xr.baseExperience.onStateChangedObservable.add((state) => {
                if (state === 2) {
                    console.log("VR started. Camera:", xr.baseExperience.camera?.position);
                    // Use ref to access latest createVRMenu
                    vrUtilsRef.current.createVRMenu(sceneInstance, xr);
                    // VR interactions will be setup in useEffect
                }
            });

        } catch (e) {
            console.log("WebXR not supported", e);
        }
    }, []); // Empty dependency array ensures stability

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
            onSelect,
            (nodeData, type) => detailsPanelRef.current.create(scene, nodeData, type),
            xrHelperRef
        );
        graphRenderer.current.createEdges(
            data,
            scene,
            nodeMeshesRef.current,
            onSelect,
            (edgeData, type) => detailsPanelRef.current.create(scene, edgeData, type),
            xrHelperRef
        );

        // Setup VR interactions if VR is active
        if (xrHelperRef.current && xrHelperRef.current.baseExperience.state === 2) {
            graphRenderer.current.setupVRInteractions(nodeMeshesRef.current, data.nodes.map(n => n.id));
        }

    }, [scene, data, onSelect]);

    return (
        <div className="h-full w-full overflow-hidden rounded-xl bg-black/20" style={{ touchAction: 'none' }}>
            <SceneComponent
                antialias
                onSceneReady={onSceneReady}
                id="graph-canvas"
                className="h-full w-full outline-none"
                style={{ touchAction: 'none' }}
            />
        </div>
    );
}
