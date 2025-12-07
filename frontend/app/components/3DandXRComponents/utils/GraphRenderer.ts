import { Vector3, Color3, Color4, MeshBuilder, StandardMaterial, Scene, Mesh, ActionManager, ExecuteCodeAction, InstancedMesh, PBRMaterial } from '@babylonjs/core';
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
        nodeMeshes: Map<string, Mesh | InstancedMesh>,
        onSelect?: (data: any, type: 'node' | 'edge') => void,
        onVRSelect?: (data: any, type: string) => void,
        xrHelperRef?: { current: any }
    ) {
        // Create a master mesh for instancing
        // Using PBR material for better aesthetics (metallic/roughness)
        const masterMesh = MeshBuilder.CreateSphere("master_node_sphere", { diameter: 2, segments: 16 }, scene);
        const nodeMaterial = new PBRMaterial("nodeMat", scene);
        // Set albedo to white so instance color controls the final color
        nodeMaterial.albedoColor = Color3.White();
        nodeMaterial.emissiveColor = new Color3(0.05, 0.2, 0.4); // Slight glow
        nodeMaterial.metallic = 0.8;
        nodeMaterial.roughness = 0.2;
        nodeMaterial.alpha = 1.0;
        masterMesh.material = nodeMaterial;
        masterMesh.isVisible = false; // Hide the master mesh

        // Register instanced buffer for individual colors if needed
        masterMesh.registerInstancedBuffer("color", 4);
        masterMesh.instancedBuffers.color = new Color4(0.1, 0.6, 0.9, 1);

        const labelTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        data.nodes.forEach(node => {
            // Create an instance instead of a clone or new mesh
            const instance = masterMesh.createInstance(node.id);
            instance.position = new Vector3(node.x, node.y, node.z);
            
            // Apply custom color if present
            if (node.color) {
                const c = Color3.FromHexString(node.color);
                instance.instancedBuffers.color = new Color4(c.r, c.g, c.b, 1);
            }

            if (node.label || node.id) {
                const label = new GUI.TextBlock();
                label.text = node.label || node.id;
                label.color = "white";
                label.fontSize = 14;
                label.outlineWidth = 2;
                label.outlineColor = "black";
                labelTexture.addControl(label);
                label.linkWithMesh(instance);
                label.linkOffsetY = -30;
            }

            instance.actionManager = new ActionManager(scene);
            const originalScaling = instance.scaling.clone();

            instance.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                    // Scale up
                    instance.scaling = originalScaling.scale(1.3);
                    
                    instance.renderOutline = true;
                    instance.outlineColor = Color3.White();
                    instance.outlineWidth = 0.1;
                    // Bright white/cyan on hover
                    instance.instancedBuffers.color = new Color4(0.8, 1, 1, 1);
                })
            );
            instance.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                    // Scale down
                    instance.scaling = originalScaling;

                    instance.renderOutline = false;
                    // Reset color
                    if (node.color) {
                        const c = Color3.FromHexString(node.color);
                        instance.instancedBuffers.color = new Color4(c.r, c.g, c.b, 1);
                    } else {
                        instance.instancedBuffers.color = new Color4(0.1, 0.6, 0.9, 1);
                    }
                })
            );
            instance.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    // Visual feedback on click (Flash white)
                    instance.instancedBuffers.color = new Color4(1, 1, 1, 1);
                    setTimeout(() => {
                        // Return to hover state
                        instance.instancedBuffers.color = new Color4(0.5, 0.8, 1, 1);
                    }, 200);

                    if (onSelect) onSelect(node, 'node');
                    if (xrHelperRef?.current && xrHelperRef.current.baseExperience.state === 2 && onVRSelect) {
                        onVRSelect(node, 'node');
                    }
                })
            );

            nodeMeshes.set(node.id, instance);
        });
    }

    createEdges(
        data: GraphData,
        scene: Scene,
        nodeMeshes: Map<string, Mesh | InstancedMesh>,
        onSelect?: (data: any, type: 'node' | 'edge') => void,
        onVRSelect?: (data: any, type: string) => void,
        xrHelperRef?: { current: any }
    ) {
        data.edges.forEach(edge => {
            const sourceMesh = nodeMeshes.get(edge.source);
            const targetMesh = nodeMeshes.get(edge.target);

            if (sourceMesh && targetMesh) {
                const points = [sourceMesh.position, targetMesh.position];
                
                // Create the visual line
                const line = MeshBuilder.CreateLines(`edge_${edge.source}_${edge.target}`, { 
                    points,
                    updatable: false 
                }, scene);
                
                // Distinct color for edges (Purple/Pink to contrast with Blue nodes)
                line.color = new Color3(0.8, 0.4, 0.8);
                line.alpha = 0.4;
                
                // Optimization: Use the line itself for picking with a threshold
                // instead of creating a separate tube mesh
                line.isPickable = true;
                line.intersectionThreshold = 0.5; // Makes the line easier to click

                line.actionManager = new ActionManager(scene);
                
                // Highlight on hover
                line.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                        line.color = new Color3(1, 0.6, 1); // Brighter pink on hover
                        line.alpha = 1;
                    })
                );
                
                line.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                        line.color = new Color3(0.8, 0.4, 0.8); // Reset to base color
                        line.alpha = 0.4;
                    })
                );

                line.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                        // Visual feedback on click (Flash white)
                        line.color = Color3.White();
                        line.alpha = 1;
                        setTimeout(() => {
                            line.color = new Color3(1, 0.6, 1); // Return to hover state
                        }, 200);

                        if (onSelect) onSelect(edge, 'edge');
                        if (xrHelperRef?.current && xrHelperRef.current.baseExperience.state === 2 && onVRSelect) {
                            onVRSelect(edge, 'edge');
                        }
                    })
                );
            }
        });
    }

    setupVRInteractions(nodeMeshes: Map<string, Mesh | InstancedMesh>, nodeIds: string[]) {
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

    disposeGraph(nodeMeshes: Map<string, Mesh | InstancedMesh>, scene: Scene) {
        // Dispose all node meshes (instances)
        nodeMeshes.forEach((mesh) => {
            mesh.dispose();
        });
        nodeMeshes.clear();

        // Dispose master mesh if it exists
        const masterMesh = scene.getMeshByName("master_node_sphere");
        if (masterMesh) {
            masterMesh.dispose();
        }

        // Dispose node material
        const nodeMaterial = scene.getMaterialByName("nodeMat");
        if (nodeMaterial) {
            nodeMaterial.dispose();
        }

        // Dispose all edge meshes (lines)
        // Iterate over a copy of the meshes array to avoid issues when modifying the array during iteration
        [...scene.meshes].forEach(mesh => {
            if (mesh.name.startsWith('edge_') || mesh.name.startsWith('tube_')) {
                mesh.dispose();
            }
        });

        // Dispose UI textures if any (attached to nodes)
        // Iterate over a copy of the textures array
        [...scene.textures].forEach(texture => {
            if (texture instanceof GUI.AdvancedDynamicTexture && texture.name === "UI") {
                texture.dispose();
            }
        });
    }
}
