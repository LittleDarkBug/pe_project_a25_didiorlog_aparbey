import { Vector3, Scene, Mesh, TransformNode, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class VRDetailsPanel {
    private panelMesh: Mesh | null = null;
    private texture: GUI.AdvancedDynamicTexture | null = null;

    create(scene: Scene, data: any, type: string, xrHelper?: any, anchorMesh?: Mesh | TransformNode | any) {
        // Clean up previous instance
        this.dispose();

        if (!data) return;

        console.log("VRDetailsPanel: Creating Mesh Panel for", type);

        // --- 1. Create Plane Mesh (Like VR Menu) ---
        // 1.2 x 0.9 meters
        this.panelMesh = MeshBuilder.CreatePlane("detailsPanel", { width: 1.2, height: 0.9 }, scene);

        // --- 2. Create AdvancedDynamicTexture ---
        // 1024x768 resolution for crisp text
        this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(this.panelMesh, 1024, 768);

        // Theme
        const theme = {
            bg: "#0f172a", // Slate 950
            primary: type === 'node' ? "#60a5fa" : "#c084fc",
            text: "#f8fafc",
            border: "#334155"
        };

        // --- 3. Content Container ---
        const container = new GUI.Rectangle();
        container.width = 1;
        container.height = 1;
        container.cornerRadius = 40;
        container.thickness = 4;
        container.color = theme.primary;
        container.background = theme.bg;
        this.texture.addControl(container);

        // Main Stack
        const mainPanel = new GUI.StackPanel();
        mainPanel.isVertical = true;
        mainPanel.paddingTop = "40px";
        mainPanel.paddingLeft = "40px";
        mainPanel.paddingRight = "40px";
        container.addControl(mainPanel);

        // Header Title
        const titleText = new GUI.TextBlock();
        titleText.text = (type === 'node' ? (data.label || "NOEUD") : "LIEN").toUpperCase();
        titleText.color = theme.primary;
        titleText.fontSize = 60;
        titleText.fontWeight = "bold";
        titleText.height = "80px";
        titleText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        mainPanel.addControl(titleText);

        const divider = new GUI.Rectangle();
        divider.height = "4px";
        divider.width = "90%";
        divider.background = theme.primary;
        divider.paddingBottom = "20px";
        mainPanel.addControl(divider);

        // -- Properties Content --
        let itemsAdded = 0;
        const createPropertyBlock = (key: string, value: any, level: number = 0) => {
            if (['id', 'x', 'y', 'z', 'source', 'target', 'index', 'fx', 'fy', 'fz', 'vx', 'vy', 'vz', 'viz'].includes(key)) {
                return null;
            }

            const block = new GUI.StackPanel();
            block.isVertical = true;
            block.height = "auto";
            block.paddingLeft = `${level * 20}px`;
            block.paddingBottom = "20px";

            // Key
            const keyText = new GUI.TextBlock();
            keyText.text = key.toUpperCase();
            keyText.color = "#94a3b8"; // Muted
            keyText.fontSize = 32;
            keyText.height = "40px";
            keyText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            block.addControl(keyText);

            // Value
            let valStr = String(value);
            if (typeof value === 'object') valStr = JSON.stringify(value);

            const valText = new GUI.TextBlock();
            valText.text = valStr;
            valText.color = "white";
            valText.fontSize = 36; // Big text
            valText.fontWeight = "bold";
            valText.height = "50px";
            valText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            valText.textWrapping = true;
            valText.resizeToFit = true;

            block.addControl(valText);

            return block;
        };

        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                const block = createPropertyBlock(key, value);
                if (block) {
                    mainPanel.addControl(block);
                    itemsAdded++;
                }
            });
        }

        if (itemsAdded === 0) {
            const noData = new GUI.TextBlock();
            noData.text = "AUCUNE DONNÉE";
            noData.color = "gray";
            noData.fontSize = 40;
            noData.height = "100px";
            mainPanel.addControl(noData);
        }

        // Close Button
        const closeBtn = GUI.Button.CreateSimpleButton("close", "FERMER");
        closeBtn.height = "80px";
        closeBtn.width = "300px"; // Fixed width
        closeBtn.color = "white";
        closeBtn.background = "#ef4444";
        closeBtn.cornerRadius = 20;
        closeBtn.fontSize = 40;
        // closeBtn.paddingTop = "40px"; // push completely down?
        closeBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.paddingBottom = "40px";

        closeBtn.onPointerClickObservable.add(() => {
            this.dispose();
        });
        // Add to CONTAINER directly to stick to bottom
        container.addControl(closeBtn);


        // --- 4. Positioning Logic ---
        let camera = scene.activeCamera;
        if (xrHelper && xrHelper.baseExperience && xrHelper.baseExperience.camera) {
            camera = xrHelper.baseExperience.camera;
        }

        if (camera && anchorMesh) {
            const nodePos = anchorMesh.absolutePosition;
            const camPos = camera.position;
            const direction = camPos.subtract(nodePos).normalize();

            // 2.0m away from node toward camera, +0.5m Up
            this.panelMesh.position = nodePos.add(direction.scale(2.0)).add(new Vector3(0, 0.5, 0));

            // Look at camera but fix rotation
            this.panelMesh.lookAt(camPos);
            // Babylon Planes often need PI rotation Y if back is culling, but ADT CreateForMesh usually handles double side
            // Let's ensure it faces correctly.
            this.panelMesh.rotation.y += Math.PI;

        } else if (camera) {
            // HUD Fallback
            const front = camera.getDirection(Vector3.Forward());
            this.panelMesh.position = camera.position.add(front.scale(2.0));
            this.panelMesh.lookAt(camera.position);
            this.panelMesh.rotation.y += Math.PI;
        } else {
            // Absolute Fallback
            this.panelMesh.position = new Vector3(0, 1.6, 2.0);
            this.panelMesh.rotation.y = Math.PI;
        }
    }

    dispose() {
        if (this.panelMesh) {
            this.panelMesh.dispose();
            this.panelMesh = null;
        }
        // texture is usually disposed with mesh, but to be sure:
        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }
    }
}
