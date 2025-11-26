import { Vector3, Color3, MeshBuilder, StandardMaterial, Scene, Mesh, ActionManager, ExecuteCodeAction } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

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

export class GraphRenderer {
    createNodes(
        data: GraphData,
        scene: Scene,
        nodeMeshes: Map<string, Mesh>,
        onSelect?: (data: any, type: 'node' | 'edge', x?: number, y?: number) => void,
        onVRSelect?: (data: any, type: string) => void,
        xrHelperRef?: { current: any }
    ) {
        const nodeMaterial = new StandardMaterial("nodeMat", scene);
        nodeMaterial.diffuseColor = new Color3(0.3, 0.7, 1);
        nodeMaterial.emissiveColor = new Color3(0.1, 0.3, 0.5);
        nodeMaterial.specularColor = new Color3(1, 1, 1);

        const labelTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        data.nodes.forEach(node => {
            const sphere = MeshBuilder.CreateSphere(node.id, { diameter: 2 }, scene);
            sphere.position = new Vector3(node.x, node.y, node.z);
            sphere.material = nodeMaterial;

            if (node.label || node.id) {
                const label = new GUI.TextBlock();
                label.text = node.label || node.id;
                label.color = "white";
                label.fontSize = 14;
                label.outlineWidth = 2;
                label.outlineColor = "black";
                labelTexture.addControl(label);
                label.linkWithMesh(sphere);
                label.linkOffsetY = -30;
            }

            sphere.actionManager = new ActionManager(scene);
            sphere.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                    sphere.renderOutline = true;
                    sphere.outlineColor = Color3.White();
                    sphere.outlineWidth = 0.1;
                })
            );
            sphere.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                    sphere.renderOutline = false;
                })
            );
            sphere.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    const pointerX = scene.pointerX;
                    const pointerY = scene.pointerY;
                    if (onSelect) onSelect(node, 'node', pointerX, pointerY);
                    if (xrHelperRef?.current && xrHelperRef.current.baseExperience.state === 2 && onVRSelect) {
                        onVRSelect(node, 'node');
                    }
                })
            );

            nodeMeshes.set(node.id, sphere);
        });
    }

    createEdges(
        data: GraphData,
        scene: Scene,
        nodeMeshes: Map<string, Mesh>,
        onSelect?: (data: any, type: 'node' | 'edge', x?: number, y?: number) => void,
        onVRSelect?: (data: any, type: string) => void,
        xrHelperRef?: { current: any }
    ) {
        data.edges.forEach(edge => {
            const sourceMesh = nodeMeshes.get(edge.source);
            const targetMesh = nodeMeshes.get(edge.target);

            if (sourceMesh && targetMesh) {
                const points = [sourceMesh.position, targetMesh.position];
                const line = MeshBuilder.CreateLines(`edge_${edge.source}_${edge.target}`, { points }, scene);
                line.color = new Color3(0.5, 0.5, 0.5);
                line.alpha = 0.3;

                const tube = MeshBuilder.CreateTube(`tube_${edge.source}_${edge.target}`, {
                    path: points,
                    radius: 0.5,
                    updatable: false
                }, scene);
                tube.visibility = 0;
                tube.isPickable = true;

                tube.actionManager = new ActionManager(scene);
                tube.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                        const pointerX = scene.pointerX;
                        const pointerY = scene.pointerY;
                        if (onSelect) onSelect(edge, 'edge', pointerX, pointerY);
                        if (xrHelperRef?.current && xrHelperRef.current.baseExperience.state === 2 && onVRSelect) {
                            onVRSelect(edge, 'edge');
                        }
                    })
                );
            }
        });
    }

    setupVRInteractions(nodeMeshes: Map<string, Mesh>, nodeIds: string[]) {
        nodeIds.forEach(id => {
            const mesh = nodeMeshes.get(id);
            if (mesh) {
                mesh.isPickable = true;

                const originalScale = mesh.scaling.clone();
                mesh.actionManager?.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                        mesh.scaling = originalScale.scale(1.5);
                    })
                );
                mesh.actionManager?.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                        mesh.scaling = originalScale;
                    })
                );
            }
        });
    }
}
