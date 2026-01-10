import { Scene, WebXRDefaultExperience } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import * as BABYLON from '@babylonjs/core';

export const useVRMenu = () => {

    // Simple VR Menu using Babylon GUI 3D
    const createVRMenu = (
        scene: Scene,
        xr: WebXRDefaultExperience,
        onLayoutRequest: (layoutName: string) => void,
        onResetFilters?: () => void,
        onToggleLabels?: () => void,
        currentLayout: string = 'forceatlas2'
    ) => {
        const manager = new GUI.GUI3DManager(scene);

        // Create a slate/panel for buttons following the user
        const panel = new GUI.StackPanel3D();
        panel.margin = 0.02; // Smaller gap
        panel.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2); // Scale down 5x (Buttons are 1m by default)
        manager.addControl(panel);

        // Position panel in front of camera
        // We use a TransformNode to anchor it
        const anchor = new BABYLON.TransformNode("anchor", scene);
        anchor.parent = xr.baseExperience.camera;
        anchor.position = new BABYLON.Vector3(0, -0.3, 2); // 2m in front, slightly lower
        panel.linkToTransformNode(anchor);

        // Helper to create buttons
        const createBtn = (text: string, onClick: () => void, color = "white", isActive = false) => {
            const btn = new GUI.HolographicButton(text);
            panel.addControl(btn);

            const txt = new GUI.TextBlock();
            txt.text = isActive ? `> ${text} <` : text;
            txt.color = isActive ? "#4ade80" : color;
            txt.fontSize = 30;
            txt.fontWeight = "bold";
            btn.content = txt;

            btn.onPointerUpObservable.add(onClick);
            return btn;
        };

        // Header
        const headerBtn = new GUI.HolographicButton("HEADER");
        panel.addControl(headerBtn);
        const headerTxt = new GUI.TextBlock();
        headerTxt.text = "OPTIONS GRAPHE";
        headerTxt.color = "#3b82f6";
        headerTxt.fontSize = 36;
        headerTxt.fontWeight = "bold";
        headerBtn.content = headerTxt;

        // 1. Layout Options
        // Full list matching backend capabilities
        const layouts = [
            { id: 'fruchterman_reingold', label: 'Fruchterman-Reingold' },
            { id: 'kamada_kawai', label: 'Kamada-Kawai' },
            { id: 'drl', label: 'DrL' },
            { id: 'force_atlas', label: 'Force Atlas 2' },
            { id: 'sphere', label: 'Sphérique' },
            { id: 'grid', label: 'Grille' },
            { id: 'random', label: 'Aléatoire' }
        ];

        layouts.forEach(l => {
            createBtn(l.label, () => onLayoutRequest(l.id), "white", l.id === currentLayout);
        });

        // 2. Action Buttons
        if (onResetFilters) {
            createBtn("RESET FILTRES", onResetFilters, "#ef4444");
        }

        // Placeholder for filter interface
        createBtn("FILTRES (Bientôt)", () => console.log("Filters TODO"), "gray");

        if (onToggleLabels) {
            createBtn("TOGGLE LABELS", onToggleLabels, "#eab308");
        }

        createBtn("FERMER", () => {
            panel.dispose();
            manager.dispose();
            anchor.dispose();
        }, "#ef4444");

        return {
            dispose: () => {
                panel.dispose();
                manager.dispose();
                anchor.dispose();
            }
        };
    };

    return { createVRMenu };
};
