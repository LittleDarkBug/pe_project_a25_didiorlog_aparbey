import { Vector3, Scene, Mesh, MeshBuilder, StandardMaterial, Color3, GlowLayer } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class VRDetailsPanel {
    private panelMesh: Mesh | null = null;
    private texture: GUI.AdvancedDynamicTexture | null = null;
    private scene: Scene | null = null;

    constructor() { }

    public create(
        scene: Scene,
        data: any,
        type: string,
        xrHelper?: any
    ) {
        // Clean up previous panel
        this.dispose();
        if (!data) return;
        this.scene = scene;

        console.log("VRDetailsPanel: Creating Panel based on Reference");

        // 1. Create Plane (Reference Style: World Space + Billboard)
        this.panelMesh = MeshBuilder.CreatePlane("VR_UI_Panel", { width: 4, height: 3 }, scene);

        // Position Logic: Clone from mesh position if available (passed as data?) 
        // Or find the mesh in scene by ID. 
        // Note: 'data' is the node data. To get the position, we need the matching mesh.
        const meshID = data.id;
        const targetMesh = scene.getMeshByName(meshID);

        if (targetMesh) {
            // Position absolute based on target mesh
            // Reference: position = worldPosition.clone(); position.y += 8;
            const worldMatrix = targetMesh.computeWorldMatrix(true);
            const worldPosition = Vector3.TransformCoordinates(Vector3.Zero(), worldMatrix);

            this.panelMesh.position = worldPosition.clone();
            this.panelMesh.position.y += 2.5; // Slightly above (unit adjusted for likely scale)
            // If scale is small, 8 might be huge. Assuming standard units approx meters.
        } else {
            // Fallback: in front of camera if no mesh found
            if (scene.activeCamera) {
                const cam = scene.activeCamera;
                this.panelMesh.position = cam.position.add(cam.getDirection(Vector3.Forward()).scale(3));
            }
        }

        this.panelMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;

        // 2. Texture Creation
        this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(this.panelMesh, 1024, 768);
        this.texture.hasAlpha = true; // Use alpha for transparency effects

        // 3. UI Construction (Based on Reference)
        // Main Container
        const mainContainer = new GUI.Rectangle();
        mainContainer.width = 1;
        mainContainer.height = 1;
        mainContainer.cornerRadius = 40;
        mainContainer.color = "rgba(100, 200, 255, 0.5)"; // Light Blue Border
        mainContainer.thickness = 4;
        mainContainer.background = "rgba(10, 15, 35, 0.95)"; // Dark Blue Background
        this.texture.addControl(mainContainer);

        // Header Background (Gradient simulation)
        const headerBg = new GUI.Rectangle();
        headerBg.width = 1;
        headerBg.height = "150px";
        headerBg.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        headerBg.cornerRadius = 40; // Match top corners
        headerBg.thickness = 0;
        headerBg.background = "#2b3eb1"; // Fallback blue
        // Gradient not directly supported in simple background string without Context2D commands, 
        // sticking to solid color for stability.
        headerBg.alpha = 0.5;
        mainContainer.addControl(headerBg);

        // Title (Label or ID)
        const title = new GUI.TextBlock();
        title.text = (data.label || data.id || "Unknown").toUpperCase();
        title.color = "white";
        title.fontSize = 70;
        title.fontWeight = "bold";
        title.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        title.top = 30;
        mainContainer.addControl(title);

        // Subtitle (ID)
        const subtitle = new GUI.TextBlock();
        subtitle.text = `${type === 'node' ? 'NODE' : 'EDGE'} ID: ${data.id}`;
        subtitle.color = "rgba(200, 220, 255, 0.7)";
        subtitle.fontSize = 36;
        subtitle.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        subtitle.top = 100;
        mainContainer.addControl(subtitle);

        // Properties List (Scrollable if many)
        const sv = new GUI.ScrollViewer();
        sv.width = 0.9;
        sv.height = 0.65; // Adjust based on header
        const container = new GUI.Rectangle();
        container.width = 1;
        container.height = 1;
        container.cornerRadius = 40;
        container.color = "#3b82f6"; // Blue border
        container.thickness = 4;
        container.background = "rgba(10, 10, 20, 0.95)"; // Opaque dark background
        if (this.texture) {
            this.texture.addControl(container);
        }

        const contentStack = new GUI.StackPanel();
        contentStack.width = 0.9;
        contentStack.top = "20px";
        container.addControl(contentStack);

        // Header
        const header = new GUI.TextBlock();
        header.text = type === 'node' ? "DÉTAILS NOEUD" : "DÉTAILS LIEN";
        header.color = "#60a5fa";
        header.fontSize = 60;
        header.height = "80px";
        header.fontWeight = "bold";
        contentStack.addControl(header);

        // ID
        const idText = new GUI.TextBlock();
        idText.text = `ID: ${data.id}`;
        idText.color = "white";
        idText.fontSize = 40;
        idText.height = "60px";
        idText.textWrapping = true;
        contentStack.addControl(idText);

        // Properties Scroll Viewer
        const scrollViewer = new GUI.ScrollViewer();
        scrollViewer.width = 0.9;
        scrollViewer.height = 0.6;
        scrollViewer.thickness = 0;
        scrollViewer.barColor = "#60a5fa";
        scrollViewer.barSize = 20;
        contentStack.addControl(scrollViewer);

        const propsStack = new GUI.StackPanel();
        scrollViewer.addControl(propsStack);

        // Add Properties
        Object.entries(data).forEach(([key, value]) => {
            if (['id', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'index'].includes(key)) return;

            const pPanel = new GUI.StackPanel();
            pPanel.height = "100px";
            pPanel.isVertical = true;

            const kText = new GUI.TextBlock();
            kText.text = key.toUpperCase();
            kText.color = "#94a3b8"; // Slate 400
            kText.fontSize = 28;
            kText.height = "40px";
            kText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            pPanel.addControl(kText);

            const vText = new GUI.TextBlock();
            vText.text = String(value);
            vText.color = "white";
            vText.fontSize = 34; // Readable size
            vText.height = "60px";
            vText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            vText.textWrapping = true;
            pPanel.addControl(vText);

            propsStack.addControl(pPanel);
        });

        // Close Button
        const closeBtn = GUI.Button.CreateSimpleButton("closeBtn", "FERMER");
        closeBtn.width = "200px";
        closeBtn.height = "80px";
        closeBtn.color = "white";
        closeBtn.cornerRadius = 20;
        closeBtn.background = "#ef4444";
        closeBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.paddingBottom = "20px";
        closeBtn.fontSize = 30;
        closeBtn.onPointerUpObservable.add(() => {
            this.dispose();
        });
        container.addControl(closeBtn);
    }

    public dispose() {
        if (this.panelMesh) {
            this.panelMesh.dispose();
            this.panelMesh = null;
        }
        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }
    }
}