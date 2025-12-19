import { Vector3, MeshBuilder, Scene, Mesh, StandardMaterial, Color3 } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class VRDetailsPanel {
    private currentPlane: Mesh | null = null;

    create(scene: Scene, data: any, type: string) {
        this.dispose();

        if (!data) return;

        // Create a plane for the UI
        const plane = MeshBuilder.CreatePlane("detailsPlane", { width: 3, height: 2 }, scene);
        
        // Position it in front of the user (camera)
        const camera = scene.activeCamera;
        if (camera) {
            const forward = camera.getForwardRay().direction;
            // Position slightly to the side and front
            plane.position = camera.position.add(forward.scale(3)).add(new Vector3(1, 0, 0));
            // Look at camera (inverted because planes are single sided by default usually, but GUI handles it)
            plane.lookAt(camera.position);
            // Rotate 180 deg to face camera correctly if needed, but lookAt usually handles Z axis alignment. 
            // Babylon GUI planes often need to be rotated Math.PI if text is backwards.
            plane.rotation.y += Math.PI;
        }

        // Create AdvancedDynamicTexture
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 1024, 1024);
        
        // Main Container (Glassmorphism style)
        const container = new GUI.Rectangle();
        container.width = 1;
        container.height = 1;
        container.cornerRadius = 60;
        container.color = "#60a5fa"; // Primary-400 border
        container.thickness = 4;
        container.background = "rgba(10, 10, 20, 0.85)"; // Dark background
        advancedTexture.addControl(container);

        // Content Stack
        const panel = new GUI.StackPanel();
        panel.paddingTop = "40px";
        panel.paddingBottom = "40px";
        panel.paddingLeft = "40px";
        panel.paddingRight = "40px";
        container.addControl(panel);

        // Header
        const header = new GUI.TextBlock();
        header.text = type === 'node' ? (data.label || data.id) : "Détails du Lien";
        header.color = "white";
        header.fontSize = 80;
        header.fontWeight = "bold";
        header.height = "120px";
        header.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.addControl(header);

        // Divider
        const divider = new GUI.Rectangle();
        divider.width = 1;
        divider.height = "4px";
        divider.color = "transparent";
        divider.background = "#60a5fa";
        divider.paddingBottom = "40px";
        panel.addControl(divider);

        // Properties
        Object.entries(data).forEach(([key, value]) => {
            if (['id', 'x', 'y', 'z', 'source', 'target', 'fx', 'fy', 'fz', 'vx', 'vy', 'vz', 'index'].includes(key)) return;
            
            const row = new GUI.StackPanel();
            row.isVertical = false;
            row.height = "70px";
            panel.addControl(row);

            const keyBlock = new GUI.TextBlock();
            keyBlock.text = `${key}:`;
            keyBlock.color = "#94a3b8"; // Slate-400
            keyBlock.fontSize = 40;
            keyBlock.width = 0.4;
            keyBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            row.addControl(keyBlock);

            const valueBlock = new GUI.TextBlock();
            valueBlock.text = String(value);
            valueBlock.color = "white";
            valueBlock.fontSize = 40;
            valueBlock.width = 0.6;
            valueBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            row.addControl(valueBlock);
        });

        // Close Button (Virtual)
        const closeButton = GUI.Button.CreateSimpleButton("closeBtn", "Fermer");
        closeButton.width = "300px";
        closeButton.height = "80px";
        closeButton.color = "white";
        closeButton.cornerRadius = 40;
        closeButton.background = "#ef4444"; // Red-500
        closeButton.paddingTop = "20px";
        closeButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeButton.onPointerUpObservable.add(() => {
            this.dispose();
        });
        // Add to container, not stack panel, to position at bottom
        // Actually stack panel is fine if we want it at the end of list
        panel.addControl(closeButton);

        this.currentPlane = plane;
    }

    dispose() {
        if (this.currentPlane) {
            this.currentPlane.dispose();
            this.currentPlane = null;
        }
    }
}
