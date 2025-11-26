import { Vector3, MeshBuilder, Scene, Mesh } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class VRDetailsPanel {
    private currentPlane: Mesh | null = null;

    create(scene: Scene, data: any, type: string) {
        this.dispose();

        if (!data) return;

        const plane = MeshBuilder.CreatePlane("detailsPlane", { width: 4, height: 3 }, scene);
        const camera = scene.activeCamera;
        if (camera) {
            const forward = camera.getForwardRay().direction;
            plane.position = camera.position.add(forward.scale(5));
            plane.lookAt(camera.position, Math.PI);
        }

        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane);
        const panel = new GUI.StackPanel();
        panel.background = "#000000BB";
        advancedTexture.addControl(panel);

        const title = new GUI.TextBlock();
        title.text = type === 'node' ? (data.label || data.id) : "Lien";
        title.color = "white";
        title.fontSize = 50;
        title.height = "100px";
        panel.addControl(title);

        Object.entries(data).forEach(([key, value]) => {
            if (['id', 'x', 'y', 'z', 'source', 'target'].includes(key)) return;
            const text = new GUI.TextBlock();
            text.text = `${key}: ${value}`;
            text.color = "#AAAAAA";
            text.fontSize = 30;
            text.height = "50px";
            panel.addControl(text);
        });

        this.currentPlane = plane;
    }

    dispose() {
        if (this.currentPlane) {
            this.currentPlane.dispose();
            this.currentPlane = null;
        }
    }
}
