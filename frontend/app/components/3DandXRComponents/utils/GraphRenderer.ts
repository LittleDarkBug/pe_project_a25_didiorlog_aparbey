import { Vector3, Color3, Color4, MeshBuilder, StandardMaterial, Scene, Mesh, ActionManager, ExecuteCodeAction, InstancedMesh, PBRMaterial, Quaternion, Matrix } from '@babylonjs/core';
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

        // OPTIMIZATION: Single UI Texture for all tooltips
        const labelTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const tooltip = new GUI.TextBlock();
        tooltip.text = "";
        tooltip.color = "white";
        tooltip.fontSize = 14;
        tooltip.outlineWidth = 2;
        tooltip.outlineColor = "black";
        tooltip.isVisible = false;
        labelTexture.addControl(tooltip);

        data.nodes.forEach(node => {
            // Create an instance instead of a clone or new mesh
            const instance = masterMesh.createInstance(node.id);
            instance.position = new Vector3(node.x, node.y, node.z);
            
            // Apply custom color if present
            if (node.color) {
                const c = Color3.FromHexString(node.color);
                instance.instancedBuffers.color = new Color4(c.r, c.g, c.b, 1);
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

                    // Show Tooltip
                    if (node.label || node.id) {
                        tooltip.text = node.label || node.id;
                        tooltip.linkWithMesh(instance);
                        tooltip.linkOffsetY = -30;
                        tooltip.isVisible = true;
                    }
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

                    // Hide Tooltip
                    tooltip.isVisible = false;
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
        // OPTIMIZATION: Use Instanced Meshes (Cylinders) for Edges
        // This allows 1 draw call while keeping individual interactivity (picking/hover)
        
        // 1. Create Master Edge (Cylinder aligned with Z axis for easier lookAt)
        const masterEdge = MeshBuilder.CreateCylinder("master_edge_cylinder", {
            height: 1,
            diameter: 0.05, // Thin line
            tessellation: 6 // Low poly for performance
        }, scene);
        
        // Rotate geometry so cylinder aligns with Z axis (default is Y)
        masterEdge.rotation.x = Math.PI / 2;
        masterEdge.bakeCurrentTransformIntoVertices();

        const edgeMaterial = new PBRMaterial("edgeMat", scene);
        edgeMaterial.albedoColor = Color3.White();
        edgeMaterial.emissiveColor = new Color3(0.5, 0.2, 0.5);
        edgeMaterial.metallic = 0.0;
        edgeMaterial.roughness = 1.0;
        edgeMaterial.alpha = 0.4;
        masterEdge.material = edgeMaterial;
        masterEdge.isVisible = false;

        // Register instanced buffer for individual colors
        masterEdge.registerInstancedBuffer("color", 4);
        masterEdge.instancedBuffers.color = new Color4(0.8, 0.4, 0.8, 0.4);

        data.edges.forEach(edge => {
            const sourceMesh = nodeMeshes.get(edge.source);
            const targetMesh = nodeMeshes.get(edge.target);

            if (sourceMesh && targetMesh) {
                const instance = masterEdge.createInstance(`edge_${edge.source}_${edge.target}`);
                
                const p1 = sourceMesh.position;
                const p2 = targetMesh.position;
                
                // Position at midpoint
                instance.position = Vector3.Center(p1, p2);
                
                // Scale Z to length
                const distance = Vector3.Distance(p1, p2);
                instance.scaling.z = distance;
                
                // Rotate to look at target
                instance.lookAt(p2);

                // Interactions
                instance.actionManager = new ActionManager(scene);
                instance.isPickable = true;

                instance.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                        instance.instancedBuffers.color = new Color4(1, 0.6, 1, 1); // Highlight
                        instance.scaling.x = 4; // Thicker on hover
                        instance.scaling.y = 4;
                    })
                );

                instance.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                        instance.instancedBuffers.color = new Color4(0.8, 0.4, 0.8, 0.4); // Reset
                        instance.scaling.x = 1;
                        instance.scaling.y = 1;
                    })
                );

                instance.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                        // Visual feedback
                        instance.instancedBuffers.color = new Color4(1, 1, 1, 1);
                        setTimeout(() => {
                            instance.instancedBuffers.color = new Color4(1, 0.6, 1, 1);
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

        // Dispose master edge mesh
        const masterEdge = scene.getMeshByName("master_edge_cylinder");
        if (masterEdge) {
            masterEdge.dispose();
        }

        // Dispose node material
        const nodeMaterial = scene.getMaterialByName("nodeMat");
        if (nodeMaterial) {
            nodeMaterial.dispose();
        }

        // Dispose edge material
        const edgeMaterial = scene.getMaterialByName("edgeMat");
        if (edgeMaterial) {
            edgeMaterial.dispose();
        }

        // Dispose all edge meshes (instances)
        // Iterate over a copy of the meshes array to avoid issues when modifying the array during iteration
        [...scene.meshes].forEach(mesh => {
            if (mesh.name.startsWith('edge_') || mesh.name === 'edges_system') {
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
