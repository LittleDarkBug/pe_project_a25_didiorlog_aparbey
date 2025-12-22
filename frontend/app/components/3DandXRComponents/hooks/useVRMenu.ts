import { Vector3, Color3, MeshBuilder, StandardMaterial, Scene, Mesh } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export function useVRMenu() {
    const createVRMenu = (scene: Scene, xr: any, onLayoutSelect?: (algo: string) => void) => {
        // --- 1. Panel Setup ---
        const menuPanel = MeshBuilder.CreatePlane("vrMenu", { width: 4, height: 2.5 }, scene); // Widescreen

        // Positioning
        if (xr && xr.baseExperience && xr.baseExperience.camera) {
            const camera = xr.baseExperience.camera;
            const forward = camera.getForwardRay().direction;
            forward.y = 0;
            menuPanel.position = camera.position.add(forward.scale(2.2));
            menuPanel.lookAt(camera.position);
            menuPanel.rotation.y += Math.PI;
        } else if (scene.activeCamera) {
            menuPanel.position = new Vector3(0, 1.6, 2.5);
            menuPanel.billboardMode = Mesh.BILLBOARDMODE_ALL;
        }

        // --- 2. High-Res UI & Theme ---
        // 2048x1280 for sharp text
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(menuPanel, 2048, 1280);

        // Colors
        const theme = {
            bg: "rgba(15, 23, 42, 0.95)", // Slate 950
            primary: "#8b5cf6", // Violet 500
            primaryHover: "#7c3aed", // Violet 600
            secondary: "#1e293b", // Slate 800
            secondaryBorder: "#334155", // Slate 700
            text: "#f8fafc", // Slate 50
            textMuted: "#94a3b8", // Slate 400
            danger: "#ef4444", // Red 500
            dangerHover: "#dc2626", // Red 600
        };

        // Main Container (Glassmorphism)
        const container = new GUI.Rectangle();
        container.width = 1;
        container.height = 1;
        container.cornerRadius = 60;
        container.thickness = 4;
        container.color = theme.secondaryBorder;
        container.background = theme.bg;
        advancedTexture.addControl(container);

        // Grid Layout
        const mainGrid = new GUI.Grid();
        mainGrid.paddingTop = "40px";
        mainGrid.paddingBottom = "40px";
        mainGrid.paddingLeft = "60px";
        mainGrid.paddingRight = "60px";
        mainGrid.addRowDefinition(0.2); // Header
        mainGrid.addRowDefinition(0.65); // Layouts
        mainGrid.addRowDefinition(0.15); // Footer
        container.addControl(mainGrid);

        // --- 3. Header ---
        const headerStack = new GUI.StackPanel();
        headerStack.isVertical = false;
        headerStack.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        // Indicator Bar
        const indicator = new GUI.Rectangle();
        indicator.width = "10px";
        indicator.height = "80px";
        indicator.cornerRadius = 5;
        indicator.background = theme.primary;
        indicator.thickness = 0;
        headerStack.addControl(indicator);

        // Title Text
        const title = new GUI.TextBlock();
        title.text = "MENU IMMERSIF";
        title.color = theme.text;
        title.fontSize = 80;
        title.fontWeight = "bold";
        title.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        title.paddingLeft = "30px";
        title.resizeToFit = true;
        headerStack.addControl(title);

        mainGrid.addControl(headerStack, 0, 0);

        // --- 4. Layouts Section ---
        const layoutContainer = new GUI.Rectangle();
        layoutContainer.thickness = 0;
        layoutContainer.paddingTop = "20px";
        layoutContainer.paddingBottom = "20px";
        mainGrid.addControl(layoutContainer, 1, 0);

        const subHeader = new GUI.TextBlock();
        subHeader.text = "DISPOSITIONS (ALGORITHMES)";
        subHeader.color = theme.textMuted;
        subHeader.fontSize = 30;
        subHeader.fontWeight = "bold";
        subHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        subHeader.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        subHeader.height = "50px";
        layoutContainer.addControl(subHeader);

        const layoutsParams = [
            { id: 'fruchterman_reingold', label: 'Fruchterman (Std)' },
            { id: 'kamada_kawai', label: 'Kamada (Organique)' },
            { id: 'drl', label: 'DrL (Cluster)' },
            { id: 'sphere', label: 'Sphérique 3D' },
            { id: 'grid', label: 'Grille Statique' },
            { id: 'circular', label: 'Circulaire' },
        ];

        // Grid for buttons
        const btnGrid = new GUI.Grid();
        btnGrid.paddingTop = "60px"; // Space for subheader
        btnGrid.addColumnDefinition(0.33);
        btnGrid.addColumnDefinition(0.33);
        btnGrid.addColumnDefinition(0.33);
        btnGrid.addRowDefinition(0.5);
        btnGrid.addRowDefinition(0.5);

        layoutContainer.addControl(btnGrid);

        // Helper for fancy buttons
        const createOptionBtn = (text: string, row: number, col: number, callback: () => void) => {
            const wrapper = new GUI.Rectangle();
            wrapper.thickness = 0;
            wrapper.paddingLeft = "10px";
            wrapper.paddingRight = "10px";
            wrapper.paddingTop = "10px";
            wrapper.paddingBottom = "10px";

            // To emulate complex button, we use a container with events
            const btnBg = new GUI.Rectangle();
            btnBg.background = theme.secondary;
            btnBg.cornerRadius = 20;
            btnBg.thickness = 2;
            btnBg.color = theme.secondaryBorder;
            btnBg.isPointerBlocker = true;

            const btnText = new GUI.TextBlock();
            btnText.text = text;
            btnText.color = theme.text;
            btnText.fontSize = 35;
            btnText.fontWeight = "bold";
            btnBg.addControl(btnText);

            // Explicit pointer events on the background rectangle
            btnBg.onPointerEnterObservable.add(() => {
                btnBg.background = theme.primary;
                btnBg.color = theme.primary;
                btnBg.thickness = 0;
            });
            btnBg.onPointerOutObservable.add(() => {
                btnBg.background = theme.secondary;
                btnBg.color = theme.secondaryBorder;
                btnBg.thickness = 2;
            });
            // Click event needs to be on the control itself
            btnBg.onPointerClickObservable.add(() => {
                // Flash feedback
                btnBg.background = "#fff";
                btnText.color = "#000";
                setTimeout(() => {
                    // Reset will happen on pointer out usually, or here
                    btnBg.background = theme.secondary;
                    btnText.color = theme.text;
                    callback();
                }, 150);
            });

            wrapper.addControl(btnBg); // Add our custom button to wrapper
            btnGrid.addControl(wrapper, row, col);
        };

        layoutsParams.forEach((algo, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            createOptionBtn(algo.label, row, col, () => {
                if (onLayoutSelect) onLayoutSelect(algo.id);
            });
        });

        // --- 5. Footer Actions ---
        const footerGrid = new GUI.Grid();
        footerGrid.addColumnDefinition(0.5);
        footerGrid.addColumnDefinition(0.5);
        mainGrid.addControl(footerGrid, 2, 0);

        // Action Button Helper
        const createActionBtn = (text: string, bgColor: string, hoverColor: string, col: number, action: () => void) => {
            const wrapper = new GUI.Rectangle();
            wrapper.thickness = 0;
            wrapper.paddingLeft = "20px";
            wrapper.paddingRight = "20px";

            const btn = GUI.Button.CreateSimpleButton("actionBtn", text);
            btn.color = "white";
            btn.fontSize = 40;
            btn.fontWeight = "bold";
            btn.background = bgColor;
            btn.cornerRadius = 25;
            btn.thickness = 0;

            btn.onPointerEnterObservable.add(() => btn.background = hoverColor);
            btn.onPointerOutObservable.add(() => btn.background = bgColor);
            btn.onPointerClickObservable.add(action);

            wrapper.addControl(btn);
            footerGrid.addControl(wrapper, 0, col);
        };

        createActionBtn("Recentrer", theme.secondaryBorder, theme.primary, 0, () => {
            if (xr && xr.baseExperience.camera) {
                xr.baseExperience.camera.position = new Vector3(0, 0, 0);
            }
        });

        createActionBtn("Quitter", theme.danger, theme.dangerHover, 1, () => {
            if (xr && xr.baseExperience) {
                xr.baseExperience.exitXRAsync();
                menuPanel.dispose();
            }
        });

        const menuMaterial = new StandardMaterial("menuMat", scene);
        menuMaterial.emissiveColor = new Color3(0.05, 0.05, 0.1);
        menuMaterial.alpha = 0.95;
        menuPanel.material = menuMaterial;

        return menuPanel;
    };

    return { createVRMenu };
}
