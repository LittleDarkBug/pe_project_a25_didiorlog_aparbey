import { Vector3, Color3, MeshBuilder, StandardMaterial, Scene, Mesh } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export function useVRMenu() {
    const createVRMenu = (scene: Scene, xr: any) => {
        const menuPanel = MeshBuilder.CreatePlane("vrMenu", { width: 2, height: 1.5 }, scene);

        if (scene.activeCamera) {
            menuPanel.position = new Vector3(-1.5, 1.5, 2);
            menuPanel.billboardMode = Mesh.BILLBOARDMODE_ALL;
        }

        const menuTexture = GUI.AdvancedDynamicTexture.CreateForMesh(menuPanel);
        const mainPanel = new GUI.StackPanel();
        mainPanel.width = "100%";
        mainPanel.height = "100%";
        mainPanel.background = "#000000DD";
        mainPanel.paddingTop = "20px";
        mainPanel.paddingBottom = "20px";
        menuTexture.addControl(mainPanel);

        const title = new GUI.TextBlock();
        title.text = "🎮 MENU VR";
        title.color = "white";
        title.fontSize = 60;
        title.height = "80px";
        title.fontWeight = "bold";
        mainPanel.addControl(title);

        const spacer1 = new GUI.Rectangle();
        spacer1.height = "20px";
        spacer1.thickness = 0;
        mainPanel.addControl(spacer1);

        const exitButton = GUI.Button.CreateSimpleButton("exitVR", "🚪 Quitter VR");
        exitButton.width = "80%";
        exitButton.height = "120px";
        exitButton.color = "white";
        exitButton.fontSize = 50;
        exitButton.background = "#FF4444";
        exitButton.cornerRadius = 20;
        exitButton.thickness = 0;

        exitButton.onPointerEnterObservable.add(() => {
            exitButton.background = "#FF6666";
            exitButton.scaleX = 1.05;
            exitButton.scaleY = 1.05;
        });

        exitButton.onPointerOutObservable.add(() => {
            exitButton.background = "#FF4444";
            exitButton.scaleX = 1.0;
            exitButton.scaleY = 1.0;
        });

        exitButton.onPointerClickObservable.add(() => {
            if (xr && xr.baseExperience) {
                xr.baseExperience.exitXRAsync();
                menuPanel.dispose();
            }
        });

        mainPanel.addControl(exitButton);

        const spacer2 = new GUI.Rectangle();
        spacer2.height = "20px";
        spacer2.thickness = 0;
        mainPanel.addControl(spacer2);

        const resetButton = GUI.Button.CreateSimpleButton("resetView", "🔄 Recentrer");
        resetButton.width = "80%";
        resetButton.height = "100px";
        resetButton.color = "white";
        resetButton.fontSize = 45;
        resetButton.background = "#4444FF";
        resetButton.cornerRadius = 20;
        resetButton.thickness = 0;

        resetButton.onPointerEnterObservable.add(() => {
            resetButton.background = "#6666FF";
        });

        resetButton.onPointerOutObservable.add(() => {
            resetButton.background = "#4444FF";
        });

        resetButton.onPointerClickObservable.add(() => {
            if (xr && xr.baseExperience.camera) {
                xr.baseExperience.camera.position = new Vector3(0, 20, 80);
            }
        });

        mainPanel.addControl(resetButton);

        const menuMaterial = new StandardMaterial("menuMat", scene);
        menuMaterial.emissiveColor = new Color3(0.1, 0.1, 0.2);
        menuMaterial.alpha = 0.95;
        menuPanel.material = menuMaterial;

        return menuPanel;
    };

    return { createVRMenu };
}
