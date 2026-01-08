import { useRef, useCallback } from 'react';
import { Mesh, Vector3, MeshBuilder, StandardMaterial, Color3, Scene } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export const useVRMenu = () => {

    const createVRMenu = useCallback((
        scene: Scene,
        xrHelper: any,
        onLayoutChange: (algo: string) => void,
        onResetFilters?: () => void,
        onToggleLabels?: () => void
    ) => {
        // Create Menu Plane
        const menuPlane = MeshBuilder.CreatePlane("vrMenu", { width: 4, height: 3 }, scene); // Wider to accommodate more buttons

        // Position info from camera
        if (xrHelper && xrHelper.baseExperience && xrHelper.baseExperience.camera) {
            const cam = xrHelper.baseExperience.camera;
            const forward = cam.getDirection(Vector3.Forward());
            const pos = cam.position.add(forward.scale(2)); // 2 meters in front
            pos.y = cam.position.y; // Same height
            menuPlane.position = pos;
            menuPlane.lookAt(cam.position);
            menuPlane.rotation.y += Math.PI; // Face user
        }

        // GUI
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(menuPlane, 1024, 768);

        const background = new GUI.Rectangle();
        background.color = "white";
        background.thickness = 2;
        background.background = "rgba(0, 0, 0, 0.8)";
        background.cornerRadius = 20;
        advancedTexture.addControl(background);

        const panel = new GUI.StackPanel();
        panel.spacing = 20;
        background.addControl(panel);

        const title = new GUI.TextBlock();
        title.text = "OPTIONS GRAPHE";
        title.color = "white";
        title.fontSize = 60;
        title.height = "100px";
        panel.addControl(title);

        const createButton = (text: string, callback: () => void, color: string = "#3b82f6") => {
            const btn = GUI.Button.CreateSimpleButton("btn_" + text, text);
            btn.width = "350px";
            btn.height = "80px";
            btn.color = "white";
            btn.background = color;
            btn.cornerRadius = 20;
            btn.fontSize = 35;
            btn.onPointerUpObservable.add(() => {
                callback();
                // Optional: Provide visual feedback or auto-close?
                // For now, keep open so user can click multiple things
            });
            return btn;
        };

        // Layout Buttons
        const layouts = [
            { id: 'fa2', label: 'Force Atlas 2' },
            { id: 'start_force_atlas_chunked', label: 'Force Atlas Iteratif' },
            { id: 'fruchterman_reingold', label: 'Fruchterman Reingold' },
            { id: 'circular', label: 'Circulaire' }
            // Add more if needed
        ];

        layouts.forEach(l => {
            const btn = createButton(l.label, () => onLayoutChange(l.id));
            panel.addControl(btn);
        });

        // Reset Filters Button
        if (onResetFilters) {
            const resetBtn = createButton("RESET FILTRES", onResetFilters, "#ef4444");
            panel.addControl(resetBtn);
        }

        // Toggle Labels Button
        if (onToggleLabels) {
            const toggleBtn = createButton("TOGGLE LABELS", onToggleLabels, "#10b981");
            panel.addControl(toggleBtn);
        }

        // Close Button
        const closeBtn = createButton("FERMER MENU", () => {
            menuPlane.dispose();
        }, "#6b7280");
        panel.addControl(closeBtn);

        return menuPlane;
    }, []);

    return { createVRMenu };
};
