'use client';

import { useRef } from 'react';
import {
    Vector3,
    Color3,
    MeshBuilder,
    StandardMaterial,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Mesh,
    GlowLayer
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
    onSelect?: (data: any, type: 'node' | 'edge' | null, x?: number, y?: number) => void;
}

export default function GraphScene({ data, onSelect }: GraphSceneProps) {
    const sceneRef = useRef<Scene | null>(null);
    const xrHelperRef = useRef<any>(null);
    const detailsPanelRef = useRef(new VRDetailsPanel());

    const { createVRMenu } = useVRMenu();
    const { setupLocomotion } = useVRLocomotion();
    const graphRenderer = useRef(new GraphRenderer());

    const onSceneReady = async (scene: Scene) => {
        sceneRef.current = scene;

        // Scene setup
        scene.clearColor = new Color3(0.01, 0.01, 0.03).toColor4();

        // Camera setup
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 100, Vector3.Zero(), scene);
        const canvas = scene.getEngine().getRenderingCanvas();

        camera.attachControl(canvas, true);
        camera.wheelPrecision = 50;
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 500;
        camera.panningSensibility = 50;
        camera.pinchPrecision = 50;
        camera.wheelDeltaPercentage = 0.01;
        camera.inertia = 0.9;
        camera.angularSensibilityX = 1000;
        camera.angularSensibilityY = 1000;

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
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.4;
        light.diffuse = new Color3(0.9, 0.9, 1);
        light.specular = new Color3(1, 1, 1);
        light.groundColor = new Color3(0.05, 0.05, 0.1);

        const { DirectionalLight } = await import('@babylonjs/core');
        const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
        dirLight.intensity = 0.2;
        dirLight.diffuse = new Color3(0.8, 0.8, 0.9);

        // Space background
        const spaceSphere = MeshBuilder.CreateSphere("spaceSphere", { diameter: 1000 }, scene);
        const spaceMat = new StandardMaterial("spaceMat", scene);
        spaceMat.backFaceCulling = false;
        spaceMat.disableLighting = true;
        spaceMat.emissiveColor = new Color3(0.01, 0.02, 0.05);
        spaceSphere.material = spaceMat;

        // Stars
        const starMat = new StandardMaterial("starMat", scene);
        starMat.emissiveColor = new Color3(0.8, 0.8, 1);
        starMat.disableLighting = true;

        for (let i = 0; i < 200; i++) {
            const star = MeshBuilder.CreateSphere(`star_${i}`, { diameter: 0.3 }, scene);
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

        const gl = new GlowLayer("glow", scene);
        gl.intensity = 0.5;

        // Render graph
        const nodeMeshes = new Map<string, Mesh>();
        graphRenderer.current.createNodes(
            data,
            scene,
            nodeMeshes,
            onSelect,
            (nodeData, type) => detailsPanelRef.current.create(scene, nodeData, type),
            xrHelperRef
        );
        graphRenderer.current.createEdges(
            data,
            scene,
            nodeMeshes,
            onSelect,
            (edgeData, type) => detailsPanelRef.current.create(scene, edgeData, type),
            xrHelperRef
        );

        // WebXR Setup
        try {
            const xr = await scene.createDefaultXRExperienceAsync({
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
            setupLocomotion(featuresManager, xr);

            xr.baseExperience.onStateChangedObservable.add((state) => {
                if (state === 2) {
                    console.log("VR started. Camera:", xr.baseExperience.camera?.position);
                    createVRMenu(scene, xr);
                    graphRenderer.current.setupVRInteractions(nodeMeshes, data.nodes.map(n => n.id));
                }
            });

        } catch (e) {
            console.log("WebXR not supported", e);
        }
    };

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
