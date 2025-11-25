'use client';

import { Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, Color3, StandardMaterial, GlowLayer, Animation } from '@babylonjs/core';
import SceneComponent from '@/app/components/3DandXRComponents/Scene/SceneComponent';

/**
 * Composant Héros 3D pour la landing page.
 * Affiche une animation abstraite de graphe.
 */
export default function Hero3D() {
    const onSceneReady = (scene: Scene) => {
        // Fond transparent pour s'intégrer au design
        scene.clearColor.set(0, 0, 0, 0);

        // Caméra
        const camera = new ArcRotateCamera(
            'camera',
            -Math.PI / 2,
            Math.PI / 2.5,
            15,
            Vector3.Zero(),
            scene
        );
        // Pas de contrôles utilisateur pour le héros, c'est décoratif

        // Lumière
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        // Effet de lueur (Glow)
        const gl = new GlowLayer("glow", scene);
        gl.intensity = 0.6;

        // Création de nœuds (sphères)
        const nodeMaterial = new StandardMaterial('nodeMat', scene);
        nodeMaterial.emissiveColor = new Color3(0.2, 0.6, 1);
        nodeMaterial.disableLighting = true;

        const nodes = [];
        const nodeCount = 15;

        for (let i = 0; i < nodeCount; i++) {
            const node = MeshBuilder.CreateSphere(`node${i}`, { diameter: 0.5 }, scene);
            node.material = nodeMaterial;

            // Position aléatoire sur une sphère
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 5;

            node.position.x = r * Math.sin(phi) * Math.cos(theta);
            node.position.y = r * Math.sin(phi) * Math.sin(theta);
            node.position.z = r * Math.cos(phi);

            nodes.push(node);
        }

        // Création de liens (lignes)
        const lines = [];
        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                // Connecter aléatoirement si proches
                if (Vector3.Distance(nodes[i].position, nodes[j].position) < 4) {
                    const points = [nodes[i].position, nodes[j].position];
                    const line = MeshBuilder.CreateLines(`line${i}-${j}`, { points: points }, scene);
                    line.color = new Color3(0.2, 0.6, 1);
                    line.alpha = 0.3;
                    lines.push(line);
                }
            }
        }
    };

    const onRender = (scene: Scene) => {
        // Rotation lente de la caméra autour du centre
        const camera = scene.getCameraByName('camera') as ArcRotateCamera;
        if (camera) {
            camera.alpha += 0.002;
        }
    };

    return (
        <div className="h-full w-full">
            <SceneComponent
                antialias
                adaptToDeviceRatio
                onSceneReady={onSceneReady}
                onRender={onRender}
            />
        </div>
    );
}
