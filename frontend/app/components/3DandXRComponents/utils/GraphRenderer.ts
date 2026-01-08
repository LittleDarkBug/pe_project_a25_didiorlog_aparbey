import { Vector3, Color3, Color4, MeshBuilder, StandardMaterial, Scene, Mesh, ActionManager, ExecuteCodeAction, InstancedMesh, PBRMaterial, Quaternion, Matrix, TransformNode } from '@babylonjs/core';
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
    // Store edge references for filtering
    private edgeInstances: Array<{ mesh: InstancedMesh, source: string, target: string }> = [];
    private graphRoot: TransformNode | null = null; // Root for all content
    private labelsMap: Map<string, GUI.TextBlock> = new Map();
    private labelsTexture: GUI.AdvancedDynamicTexture | null = null;
    private tooltip: GUI.TextBlock | null = null;
    private showLabelsState: boolean = false;

    public getGraphRoot(): TransformNode | null {
        return this.graphRoot;
    }

    createNodes(
        data: GraphData,
        scene: Scene,
        nodeMeshes: Map<string, Mesh | InstancedMesh>,
        onSelect?: (data: any, type: 'node' | 'edge') => void,
        onVRSelect?: (data: any, type: string) => void,
        xrHelperRef?: { current: any },
        skip2DUI: boolean = false // NEW Param
    ) {
        // Create or reset Graph Root
        if (this.graphRoot) {
            this.graphRoot.dispose();
        }
        this.graphRoot = new TransformNode("GraphRoot", scene);

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
        // In VR, we skip this to prevent the Fullscreen UI from blocking ray casts
        if (!skip2DUI) {
            const labelTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            this.tooltip = new GUI.TextBlock();
            this.tooltip.text = "";
            this.tooltip.color = "white";
            this.tooltip.fontSize = 14;
            this.tooltip.outlineWidth = 2;
            this.tooltip.outlineColor = "black";
            this.tooltip.isVisible = false;
            labelTexture.addControl(this.tooltip);
        }

        // Reset Persistent Labels map
        this.labelsMap.clear();
        if (this.labelsTexture) {
            this.labelsTexture.dispose();
            this.labelsTexture = null;
        }

        data.nodes.forEach(node => {
            // Create an instance instead of a clone or new mesh
            const instance = masterMesh.createInstance(node.id);
            instance.parent = this.graphRoot; // Parent to root
            instance.position = new Vector3(node.x, node.y, node.z);
            instance.isPickable = true; // Ensure pickable for VR rays

            // ESSENTIAL: Attach metadata for VR/Web selection logic
            instance.metadata = { ...node, type: 'node' };

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

                    // Show Tooltip (Web)
                    if (this.tooltip && (node.label || node.id)) {
                        this.tooltip.text = node.label || node.id;
                        this.tooltip.linkWithMesh(instance);
                        this.tooltip.linkOffsetY = -30;
                        this.tooltip.isVisible = true;
                    }

                    // Show Tooltip (VR)
                    // Check if XR is active
                    if (xrHelperRef?.current?.baseExperience?.state === 2) { // 2 = IN_XR
                        this.showVRTooltip(node, instance, scene);
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

                    // Hide Tooltip (Web)
                    if (this.tooltip) {
                        this.tooltip.isVisible = false;
                    }
                    // Hide Tooltip (VR)
                    this.hideVRTooltip();
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
                    // Always call onVRSelect if provided - let the callback handle state checks if needed
                    if (onVRSelect) {
                        onVRSelect(node, 'node');
                    }
                })
            );

            // XR Grab logic moved to GraphSceneXR to avoid listener duplication


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
        // Clear previous edge references
        this.edgeInstances = [];

        // OPTIMIZATION: Use Instanced Meshes (Cylinders) for Edges
        // This allows 1 draw call while keeping individual interactivity (picking/hover)

        // 1. Create Master Edge (Cylinder aligned with Z axis for easier lookAt)
        const masterEdge = MeshBuilder.CreateCylinder("master_edge_cylinder", {
            height: 1,
            diameter: 0.1, // Thicker line for better visibility
            tessellation: 8
        }, scene);

        // Rotate geometry so cylinder aligns with Z axis (default is Y)
        masterEdge.rotation.x = Math.PI / 2;
        masterEdge.bakeCurrentTransformIntoVertices();

        const edgeMaterial = new PBRMaterial("edgeMat", scene);
        edgeMaterial.albedoColor = Color3.White();
        edgeMaterial.emissiveColor = new Color3(0.5, 0.2, 0.5);
        edgeMaterial.metallic = 0.0;
        edgeMaterial.roughness = 1.0;
        edgeMaterial.alpha = 0.6; // More visible
        masterEdge.material = edgeMaterial;
        masterEdge.isVisible = false;

        // Register instanced buffer for individual colors
        masterEdge.registerInstancedBuffer("color", 4);
        masterEdge.instancedBuffers.color = new Color4(0.8, 0.4, 0.8, 0.6);

        data.edges.forEach(edge => {
            const sourceMesh = nodeMeshes.get(edge.source);
            const targetMesh = nodeMeshes.get(edge.target);

            if (sourceMesh && targetMesh) {
                const instance = masterEdge.createInstance(`edge_${edge.source}_${edge.target}`);

                // Parent to graphRoot
                instance.parent = this.graphRoot;

                // Position/Scaling logic must be careful if nodes are moving!
                // If nodes move relative to root, edges must update.
                // CURRENTLY: Edges are static once created.
                // If we move NODES (grabNode), we must update connected edges on frame.
                // For now, let's assume static graph structure unless manipulated.
                // To support dynamic updates, we need an update loop for edges.

                const updateEdge = () => {
                    const p1 = sourceMesh.position;
                    const p2 = targetMesh.position;
                    // CAUTION: position is relative to parent (graphRoot). 
                    // Since both nodes and edge are children of graphRoot, local positions work fine!

                    instance.position = Vector3.Center(p1, p2);
                    const distance = Vector3.Distance(p1, p2);
                    instance.scaling.z = distance;
                    instance.lookAt(p2);
                };

                updateEdge(); // Initial

                // Store update function or rely on scene logic?
                // For this MVP, we won't auto-update edges if nodes are moved individually.
                // TODO: Add edge update logic if node dragging is critical.

                // Store reference for filtering
                this.edgeInstances.push({ mesh: instance, source: edge.source, target: edge.target });

                // Ensure visibility
                instance.isVisible = true;

                // Interactions (VR et Web)
                instance.metadata = { ...edge, type: 'edge' }; // Attach edge data as metadata
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
                    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                        // Keep Z scaling!
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

                        // Sélection VR et Web
                        if (onSelect) onSelect(edge, 'edge');
                        if (onVRSelect) {
                            onVRSelect(edge, 'edge');
                        }
                    })
                );
            }
        });
    }

    setupVRInteractions(nodeMeshes: Map<string, Mesh | InstancedMesh>, nodeIds: string[]) {
        // Moved into createNodes for better integration
    }

    /**
     * Updates the visibility of nodes and edges based on a set of visible node IDs.
     * @param visibleNodeIds Set of node IDs that should be visible. If null, all are visible.
     * @param nodeMeshes Map of node meshes
     */
    updateVisibility(visibleNodeIds: Set<string> | null, nodeMeshes: Map<string, Mesh | InstancedMesh>) {
        // 1. Update Nodes
        nodeMeshes.forEach((mesh, id) => {
            const isVisible = visibleNodeIds === null || visibleNodeIds.has(id);
            mesh.isVisible = isVisible;
            // Also disable picking if hidden to prevent ghost clicks
            mesh.isPickable = isVisible;
        });

        // 2. Update Edges
        // An edge is visible only if BOTH its source and target are visible
        this.edgeInstances.forEach(edge => {
            const isSourceVisible = visibleNodeIds === null || visibleNodeIds.has(edge.source);
            const isTargetVisible = visibleNodeIds === null || visibleNodeIds.has(edge.target);

            const isVisible = isSourceVisible && isTargetVisible;

            edge.mesh.isVisible = isVisible;
            edge.mesh.isPickable = isVisible;
        });
    }

    /**
     * Updates label visibility.
     * @param showLabels whether to show labels
     * @param nodeMeshes map of meshes
     * @param scene scene
     * @param isXR whether we are in specific XR mode (requires 3D labels)
     */
    updateLabelVisibility(showLabels: boolean, nodeMeshes: Map<string, Mesh | InstancedMesh>, scene: Scene, isXR: boolean = false) {
        this.showLabelsState = showLabels;

        if (showLabels) {
            // Web Mode: Use Fullscreen UI (Optimized)
            if (!isXR) {
                if (!this.labelsTexture) {
                    this.labelsTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("LabelsUI", true, scene);
                }
                nodeMeshes.forEach((mesh, id) => {
                    if (!this.labelsMap.has(id)) {
                        const label = new GUI.TextBlock();
                        label.text = mesh.metadata?.label || id;
                        label.color = "white";
                        label.fontSize = 12;
                        label.outlineWidth = 1.5;
                        label.outlineColor = "black";
                        this.labelsTexture!.addControl(label);
                        label.linkWithMesh(mesh);
                        label.linkOffsetY = -30;
                        this.labelsMap.set(id, label);
                    }
                    const label = this.labelsMap.get(id);
                    if (label) label.isVisible = mesh.isVisible;
                });
            }
            // VR Mode: Use World Space Planes (Necessary for XR visibility)
            else {
                // Warning: Creating individual textures for many nodes is heavy. 
                // Better approach for VR: 3D Text Planes (MeshBuilder + DynamicTexture) or specific XR UI.
                // For this fix, we will use a simple implementation.

                nodeMeshes.forEach((mesh, id) => {
                    // Check if 3D label already exists as child
                    let labelMesh = mesh.getChildren().find(c => c.name === "VR_Label_Tag") as Mesh;

                    if (!labelMesh) {
                        // Create 3D Label Plane
                        // Use a smaller plane above the node
                        labelMesh = MeshBuilder.CreatePlane("VR_Label_Tag", { width: 1.5, height: 0.5 }, scene);
                        labelMesh.parent = mesh;
                        labelMesh.position.y = 1.2; // Above node
                        labelMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;

                        // Create texture for this label
                        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(labelMesh, 256, 128);
                        const text = new GUI.TextBlock();
                        text.text = mesh.metadata?.label || id;
                        text.color = "white";
                        text.fontSize = 40; // Higher res on texture
                        text.outlineWidth = 4;
                        text.outlineColor = "black";
                        advancedTexture.addControl(text);

                        // Prevent picking on label
                        labelMesh.isPickable = false;
                    }

                    labelMesh.isVisible = mesh.isVisible;
                });
            }

        } else {
            // Hide all labels
            if (!isXR) {
                this.labelsMap.forEach(label => label.isVisible = false);
                if (this.labelsTexture) {
                    this.labelsTexture.dispose();
                    this.labelsTexture = null;
                    this.labelsMap.clear();
                }
            } else {
                // Dispose VR label meshes
                nodeMeshes.forEach((mesh) => {
                    const labelMesh = mesh.getChildren().find(c => c.name === "VR_Label_Tag");
                    if (labelMesh) labelMesh.dispose();
                });
            }
        }
    }

    private vrTooltipMesh: Mesh | null = null;
    private vrTooltipTexture: GUI.AdvancedDynamicTexture | null = null;
    private vrTooltipText: GUI.TextBlock | null = null;

    private showVRTooltip(node: any, mesh: Mesh | InstancedMesh, scene: Scene) {
        if (!this.vrTooltipMesh) {
            // Create the shared tooltip mesh
            this.vrTooltipMesh = MeshBuilder.CreatePlane("VRTooltip", { width: 2, height: 0.6 }, scene);
            this.vrTooltipMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
            this.vrTooltipMesh.isPickable = false;

            this.vrTooltipTexture = GUI.AdvancedDynamicTexture.CreateForMesh(this.vrTooltipMesh, 256, 128);
            this.vrTooltipTexture.hasAlpha = true;

            const container = new GUI.Rectangle();
            container.background = "rgba(0,0,0,0.8)";
            container.thickness = 0;
            container.cornerRadius = 20;
            this.vrTooltipTexture.addControl(container);

            this.vrTooltipText = new GUI.TextBlock();
            this.vrTooltipText.color = "white";
            this.vrTooltipText.fontSize = 40;
            this.vrTooltipText.fontWeight = "bold";
            container.addControl(this.vrTooltipText);
        }

        if (this.vrTooltipMesh && this.vrTooltipText) {
            this.vrTooltipText.text = node.label || node.id;
            this.vrTooltipMesh.position = mesh.position.clone();
            this.vrTooltipMesh.position.y += 1.5; // Slightly above
            this.vrTooltipMesh.isVisible = true;
        }
    }

    private hideVRTooltip() {
        if (this.vrTooltipMesh) {
            this.vrTooltipMesh.isVisible = false;
        }
    }

    disposeGraph(nodeMeshes: Map<string, Mesh | InstancedMesh>, scene: Scene) {
        if (this.vrTooltipMesh) {
            this.vrTooltipMesh.dispose();
            this.vrTooltipMesh = null;
        }
        if (this.vrTooltipTexture) {
            this.vrTooltipTexture.dispose();
            this.vrTooltipTexture = null;
        }
        if (this.labelsTexture) {
            this.labelsTexture.dispose();
            this.labelsTexture = null;
        }
        this.labelsMap.clear();
        this.tooltip = null;
        // Clear edge references
        this.edgeInstances = [];

        // Dispose root
        if (this.graphRoot) {
            this.graphRoot.dispose();
            this.graphRoot = null;
        }

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

        // ... (Cleanup textures)
        [...scene.textures].forEach(texture => {
            if (texture instanceof GUI.AdvancedDynamicTexture && texture.name === "UI") {
                texture.dispose();
            }
        });
    }
}

