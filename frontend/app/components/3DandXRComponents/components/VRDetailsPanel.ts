import { Vector3, MeshBuilder, Scene, Mesh, StandardMaterial, Color3 } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class VRDetailsPanel {
    private currentPlane: Mesh | null = null;
    private currentTexture: GUI.AdvancedDynamicTexture | null = null;

    create(scene: Scene, data: any, type: string) {
        this.dispose();

        if (!data) return;

        // --- 1. Create Plane ---
        // Widescreen format for better information density
        const plane = MeshBuilder.CreatePlane("detailsPlane", { width: 4, height: 3 }, scene);

        // Position logic
        // Position logic
        const camera = scene.activeCamera; // In XR, this should track the headset
        if (camera) {
            // HUD Style: Always place in front of user
            const forward = camera.getForwardRay().direction;
            forward.y = 0; // Keep roughly level with eye, or follow view?
            // Better to follow view slightly but keep upright.

            // Position: 1.5m in front, slightly right to clear center view
            // const pos = camera.position.add(forward.scale(1.5));
            // Let's use getDirection for local axes
            const front = camera.getDirection(Vector3.Forward());
            const right = camera.getDirection(Vector3.Right());

            plane.position = camera.position.add(front.scale(1.5)).add(right.scale(0.5));

            // Look at camera
            plane.lookAt(camera.position);
            // Rotate 180 deg for GUI
            plane.rotation.y += Math.PI;
        } else {
            // Fallback
            plane.position = new Vector3(0, 1.6, 2.0);
            plane.rotation.y = Math.PI;
        }

        // --- 2. Advanced Texture (High Res) ---
        // 2048x1536 for crisp text
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 2048, 1536);
        this.currentTexture = advancedTexture;

        // --- 3. Main Container (Glassmorphism) ---
        const container = new GUI.Rectangle();
        container.width = 1;
        container.height = 1;
        container.cornerRadius = 40;
        container.thickness = 4;

        // Theme Colors
        const isNode = type === 'node';
        const primaryColor = isNode ? "#60a5fa" : "#c084fc"; // Blue-400 vs Purple-400
        const borderColor = isNode ? "#3b82f6" : "#a855f7"; // Blue-500 vs Purple-500

        container.color = borderColor;
        container.background = "rgba(15, 23, 42, 0.95)"; // Slate-950 with 95% opacity

        advancedTexture.addControl(container);

        // --- 4. Content Layout ---
        const mainGrid = new GUI.Grid();
        mainGrid.addRowDefinition(0.15, false); // Header
        mainGrid.addRowDefinition(0.75, false); // Scrollable Content
        mainGrid.addRowDefinition(0.1, false);  // Footer/Close
        container.addControl(mainGrid);

        // --- Header ---
        const headerPanel = new GUI.StackPanel();
        headerPanel.isVertical = false;
        headerPanel.paddingLeft = "40px";
        headerPanel.paddingRight = "40px";
        headerPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        mainGrid.addControl(headerPanel, 0, 0);

        // Icon/Indicator
        const icon = new GUI.Rectangle();
        icon.width = "40px";
        icon.height = "40px";
        icon.cornerRadius = 20;
        icon.background = primaryColor;
        icon.thickness = 0;
        headerPanel.addControl(icon);

        const titleText = new GUI.TextBlock();
        titleText.text = isNode ? (data.label || data.id || "Nœud sans nom") : "Détails du Lien";
        titleText.color = "white";
        titleText.fontSize = 70;
        titleText.fontWeight = "bold";
        titleText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        titleText.paddingLeft = "20px";
        titleText.width = "1200px";
        headerPanel.addControl(titleText);

        const subTitle = new GUI.TextBlock();
        subTitle.text = isNode ? `ID: ${data.id}` : `${data.source} ➔ ${data.target}`;
        subTitle.color = "#94a3b8"; // Slate-400
        subTitle.fontSize = 40;
        subTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        // subTitle.width = "600px"; // Auto width
        headerPanel.addControl(subTitle);

        // Divider
        const divider = new GUI.Rectangle();
        divider.height = "2px";
        divider.width = "95%";
        divider.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        divider.background = "rgba(255, 255, 255, 0.1)";
        divider.thickness = 0;
        mainGrid.addControl(divider, 0, 0);

        // --- Scrollable Body ---
        const scrollViewer = new GUI.ScrollViewer();
        scrollViewer.width = 0.95;
        scrollViewer.height = 0.95;
        scrollViewer.thickness = 0;
        // Scrollbar styling
        scrollViewer.barSize = 20;
        scrollViewer.thumbLength = 0.5;
        scrollViewer.barColor = primaryColor;
        scrollViewer.barBackground = "rgba(255, 255, 255, 0.1)";
        mainGrid.addControl(scrollViewer, 1, 0);

        const stackPanel = new GUI.StackPanel();
        stackPanel.isVertical = true;
        stackPanel.width = 1;
        // Adapt height automatically based on children
        scrollViewer.addControl(stackPanel);

        // --- Recursive Property Renderer Helper ---
        const createPropertyBlock = (key: string, value: any, level: number = 0) => {
            // Ignore internal props
            if (['id', 'x', 'y', 'z', 'source', 'target', 'fx', 'fy', 'fz', 'vx', 'vy', 'vz', 'index'].includes(key)) return;

            const block = new GUI.StackPanel();
            block.isVertical = true;
            block.height = "auto"; // Auto height for wrapping text
            block.paddingTop = "15px";
            block.paddingBottom = "15px";
            block.paddingLeft = `${level * 40}px`; // Indentation

            // --- Key ---
            const keyText = new GUI.TextBlock();
            keyText.text = key.toUpperCase();
            keyText.color = level === 0 ? primaryColor : "#cbd5e1";
            keyText.fontSize = 35 - (level * 2);
            keyText.height = "40px";
            keyText.fontWeight = "bold";
            keyText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            block.addControl(keyText);

            // --- Value Processing ---
            let displayValue = value;
            let isComplex = false;

            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                try {
                    displayValue = JSON.parse(value);
                    isComplex = true;
                } catch (e) { /* ignore */ }
            } else if (typeof value === 'object' && value !== null) {
                isComplex = true;
            }

            if (isComplex) {
                // Recursive render
                if (Array.isArray(displayValue)) {
                    displayValue.forEach((item, idx) => {
                        // Simple array rendering
                        const itemBlock = new GUI.TextBlock();
                        itemBlock.text = `• ${typeof item === 'object' ? JSON.stringify(item) : String(item)}`;
                        itemBlock.color = "white";
                        itemBlock.fontSize = 30;
                        itemBlock.height = "40px";
                        itemBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                        itemBlock.paddingLeft = "20px";
                        block.addControl(itemBlock);
                    });
                } else if (typeof displayValue === 'object') {
                    Object.entries(displayValue).forEach(([k, v]) => {
                        const subBlock = createPropertyBlock(k, v, level + 1);
                        if (subBlock) block.addControl(subBlock);
                    });
                }
            } else {
                // Simple Value
                const valStr = (value === null || value === undefined) ? 'N/A' : String(value);

                // Text wrapping logic needed because Babylon GUI TextBlock doesn't auto-expand height easily
                // Simplified approach: fixed reasonable height or use resizeToFit

                const valueText = new GUI.TextBlock();
                valueText.text = valStr;
                valueText.color = "white";
                valueText.fontSize = 32;
                valueText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                valueText.textWrapping = true;

                // Calculate approximate height based on length
                const lineEstimate = Math.ceil(valStr.length / 80); // approx chars per line
                valueText.height = `${Math.max(50, lineEstimate * 40)}px`;

                // Background for readability
                const valueBg = new GUI.Rectangle();
                valueBg.thickness = 0;
                valueBg.background = "rgba(255, 255, 255, 0.05)";
                valueBg.cornerRadius = 10;
                valueBg.height = valueText.height;
                valueBg.addControl(valueText);

                block.addControl(valueBg);
            }

            // Separator
            const line = new GUI.Rectangle();
            line.height = "1px";
            line.width = "100%";
            line.color = "transparent";
            line.background = "rgba(255,255,255,0.05)";
            block.addControl(line);

            return block;
        };

        // Populate Content
        Object.entries(data).forEach(([key, value]) => {
            const block = createPropertyBlock(key, value);
            if (block) stackPanel.addControl(block);
        });

        // --- Footer / Close ---
        const closeBtn = GUI.Button.CreateSimpleButton("close", "FERMER");
        closeBtn.width = "300px";
        closeBtn.height = "80px";
        closeBtn.color = "white";
        closeBtn.cornerRadius = 20;
        closeBtn.background = "#ef4444";
        closeBtn.fontSize = 35;
        closeBtn.fontWeight = "bold";
        closeBtn.thickness = 0;
        closeBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        closeBtn.onPointerClickObservable.add(() => {
            this.dispose();
        });

        mainGrid.addControl(closeBtn, 2, 0);

        this.currentPlane = plane;
    }

    dispose() {
        if (this.currentPlane) {
            this.currentPlane.dispose();
            this.currentPlane = null;
        }
        if (this.currentTexture) {
            this.currentTexture.dispose();
            this.currentTexture = null;
        }
    }
}
