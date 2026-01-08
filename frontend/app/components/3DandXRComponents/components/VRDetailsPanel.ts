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
        sv.top = 50; // Offset from center/header
        sv.thickness = 0;
        sv.barSize = 20;
        sv.barColor = "#00FFFF";
        mainContainer.addControl(sv);

        const stackPanel = new GUI.StackPanel();
        stackPanel.width = "100%";
        sv.addControl(stackPanel);

        // Filter keys
        const entries = Object.entries(data)
            .filter(([k]) => !['x', 'y', 'z', 'fx', 'fy', 'fz', '__index', 'geometryId', 'vx', 'vy', 'vz', 'id', 'label', 'type'].includes(k));

        entries.forEach(([key, value]) => {
            // Attribute Row
            const row = new GUI.StackPanel(); // Use stack for vertical flow if value long? Or grid.
            row.height = "60px";
            row.isVertical = false;

            const kText = new GUI.TextBlock();
            kText.text = `${key}: `;
            kText.color = "rgba(150, 180, 255, 0.9)";
            kText.fontSize = 32;
            kText.width = 0.4;
            kText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            kText.paddingRight = "15px";
            row.addControl(kText);

            const vText = new GUI.TextBlock();
            vText.text = String(value);
            vText.color = "white";
            vText.fontSize = 32;
            vText.width = 0.6;
            vText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            row.addControl(vText);

            stackPanel.addControl(row);
        });

        // Close Button
        const closeBtn = GUI.Button.CreateSimpleButton("closeBtn", "FERMER");
        closeBtn.width = "250px";
        closeBtn.height = "80px";
        closeBtn.color = "white";
        closeBtn.background = "#ef4444";
        closeBtn.cornerRadius = 20;
        closeBtn.fontSize = 36;
        closeBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.paddingBottom = "20px";
        closeBtn.onPointerClickObservable.add(() => {
            this.dispose();
        });
        mainContainer.addControl(closeBtn);
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