import { Vector3, Scene, Mesh, TransformNode, MeshBuilder } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class VRDetailsPanel {
    private panelMesh: Mesh | null = null;
    private texture: GUI.AdvancedDynamicTexture | null = null;

    // Theme mirroring the React component (approximate hex values for Tailwind classes)
    private theme = {
        bg: "#020617",         // surface-950
        panelBg: "#0f172a",    // slightly lighter for contrast
        text: "#f8fafc",       // surface-50
        textMuted: "#94a3b8",  // surface-400
        border: "rgba(248, 250, 252, 0.1)", // surface-50/10

        // Node Colors (Blue)
        nodePrimary: "#60a5fa", // blue-400
        nodeBg: "rgba(59, 130, 246, 0.1)", // blue-500/10
        nodeBorder: "rgba(59, 130, 246, 0.2)", // blue-500/20

        // Edge Colors (Purple/Pink)
        edgePrimary: "#c084fc", // purple-400
        edgeSecondary: "#f472b6", // pink-400
        edgeBgPurple: "rgba(168, 85, 247, 0.1)", // purple-500/10
        edgeBgPink: "rgba(236, 72, 153, 0.1)", // pink-500/10

        // Data Types
        objBorder: "rgba(59, 130, 246, 0.3)", // blueish border for objects
        arrayColor: "#4ade80", // green-400 for arrays
        codeBg: "rgba(248, 250, 252, 0.05)" // surface-50/5
    };

    create(scene: Scene, data: any, type: string, xrHelper?: any, anchorMesh?: Mesh | TransformNode | any) {
        this.dispose();
        if (!data) return;

        console.log("VRDetailsPanel: Creating Enhanced Panel for", type);

        // --- 1. Panel Mesh ---
        // 1.2 x 1.4 to accommodate more vertical content structure
        this.panelMesh = MeshBuilder.CreatePlane("detailsPanel", { width: 1.2, height: 1.4 }, scene);

        // --- 2. Texture ---
        this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(this.panelMesh, 1200, 1400);

        // Main Container (Glassmorphism effect)
        const container = new GUI.Rectangle();
        container.width = 1;
        container.height = 1;
        container.cornerRadius = 40;
        container.thickness = 2; // Border
        container.color = this.theme.border;
        container.background = this.theme.bg;
        // Babylon GUI doesn't do backdrop blur, so we just use opaque dark bg
        this.texture.addControl(container);

        // Grid Layout
        const grid = new GUI.Grid();
        grid.addColumnDefinition(1);
        grid.addRowDefinition(140, true); // Header
        grid.addRowDefinition(1.0);       // Scroll Content
        grid.addRowDefinition(140, true); // Footer
        container.addControl(grid);

        // ================= HEADER =================
        const headerPanel = new GUI.StackPanel();
        headerPanel.isVertical = false;
        headerPanel.height = "100%";
        headerPanel.background = this.theme.border; // faint header bg
        grid.addControl(headerPanel, 0, 0);

        // Title
        const titleText = new GUI.TextBlock();
        titleText.text = type === 'node' ? "DÉTAILS DU NŒUD" : "DÉTAILS DU LIEN";
        titleText.color = type === 'node' ? this.theme.nodePrimary : this.theme.edgePrimary;
        titleText.fontSize = 50;
        titleText.fontWeight = "bold";
        titleText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        titleText.paddingLeft = "40px";
        headerPanel.addControl(titleText);

        // We can't easily put accurate close icon, but the footer has a big button.

        // ================= CONTENT =================
        const scrollViewer = new GUI.ScrollViewer();
        scrollViewer.thickness = 0;
        scrollViewer.paddingLeft = "20px";
        scrollViewer.paddingRight = "10px"; // space for bar
        scrollViewer.paddingTop = "20px";
        scrollViewer.paddingBottom = "20px";
        scrollViewer.barColor = type === 'node' ? this.theme.nodePrimary : this.theme.edgePrimary;
        scrollViewer.barSize = 20;
        scrollViewer.thumbHeight = 0.2;
        grid.addControl(scrollViewer, 1, 0);

        const contentStack = new GUI.StackPanel();
        contentStack.isVertical = true;
        contentStack.width = 1.0;
        scrollViewer.addControl(contentStack);

        // --- SECTION 1: MAIN METADATA (ID / Source-Target) ---
        if (type === 'node') {
            // ID Box
            const idBox = this.createSpecialBox(
                "IDENTIFIANT",
                data.id || 'N/A',
                this.theme.nodePrimary,
                this.theme.nodeBg,
                this.theme.nodeBorder
            );
            contentStack.addControl(idBox);

            // Label Box (if exists)
            if (data.label) {
                const labelContainer = new GUI.StackPanel();
                labelContainer.height = "100px";
                labelContainer.isVertical = true;
                labelContainer.paddingTop = "20px";
                labelContainer.paddingLeft = "20px";

                const helpText = new GUI.TextBlock();
                helpText.text = "LABEL";
                helpText.color = this.theme.textMuted;
                helpText.fontSize = 28;
                helpText.height = "30px";
                helpText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                labelContainer.addControl(helpText);

                const labelVal = new GUI.TextBlock();
                labelVal.text = data.label;
                labelVal.color = this.theme.text;
                labelVal.fontSize = 36;
                labelVal.fontWeight = "bold";
                labelVal.height = "50px";
                labelVal.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                labelContainer.addControl(labelVal);

                contentStack.addControl(labelContainer);
            }

        } else {
            // Edge: Source & Target
            // Side-by-side handled via Grid
            const edgeGrid = new GUI.Grid();
            edgeGrid.height = "180px";
            edgeGrid.paddingTop = "20px";
            edgeGrid.addColumnDefinition(0.5);
            edgeGrid.addColumnDefinition(0.5);

            const sourceBox = this.createSpecialBox("SOURCE", data.source, this.theme.edgePrimary, this.theme.edgeBgPurple, this.theme.edgePrimary);
            const targetBox = this.createSpecialBox("CIBLE", data.target, this.theme.edgeSecondary, this.theme.edgeBgPink, this.theme.edgeSecondary);

            // Adjust margins for grid cells
            sourceBox.paddingRight = "10px";
            targetBox.paddingLeft = "10px";

            edgeGrid.addControl(sourceBox, 0, 0);
            edgeGrid.addControl(targetBox, 0, 1);
            contentStack.addControl(edgeGrid);
        }

        // --- SECTION 2: SEPARATOR ---
        const separatorConfig = new GUI.StackPanel();
        separatorConfig.height = "80px";
        separatorConfig.paddingTop = "40px";
        const sepTitle = new GUI.TextBlock();
        sepTitle.text = `PROPRIÉTÉS DU ${type === 'node' ? 'NŒUD' : 'LIEN'}`;
        sepTitle.color = this.theme.textMuted;
        sepTitle.fontSize = 32;
        sepTitle.fontWeight = "bold";
        sepTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        sepTitle.paddingLeft = "20px";
        separatorConfig.addControl(sepTitle);

        const sepLine = new GUI.Rectangle();
        sepLine.height = "2px";
        sepLine.width = "95%";
        sepLine.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        sepLine.paddingLeft = "20px";
        sepLine.background = this.theme.border;
        separatorConfig.addControl(sepLine);

        contentStack.addControl(separatorConfig);

        // --- SECTION 3: DYNAMIC PROPERTIES ---
        // Filter keys
        const ignoredKeys = ['id', 'x', 'y', 'z', 'source', 'target', 'label', 'fx', 'fy', 'fz', 'vx', 'vy', 'vz', '__index', 'index', 'geometryId'];

        let propsCount = 0;
        Object.entries(data).forEach(([key, value]) => {
            if (ignoredKeys.includes(key)) return;

            // Attempt JSON parse if string
            let parsedVal = value;
            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                try { parsedVal = JSON.parse(value); } catch (e) { }
            }

            const propBlock = this.createPropertyBlock(key, parsedVal, type);
            if (propBlock) {
                contentStack.addControl(propBlock);
                propsCount++;
            }
        });

        if (propsCount === 0) {
            const noData = new GUI.TextBlock();
            noData.text = "Aucune propriété supplémentaire";
            noData.color = "gray";
            noData.fontSize = 30;
            noData.height = "80px";
            contentStack.addControl(noData);
        }

        // ================= FOOTER =================
        const footerCont = new GUI.Container();
        footerCont.paddingTop = "20px";
        footerCont.paddingBottom = "20px";
        grid.addControl(footerCont, 2, 0);

        const closeBtn = GUI.Button.CreateSimpleButton("close", "FERMER");
        closeBtn.width = "400px";
        closeBtn.height = "100px";
        closeBtn.color = "white";
        closeBtn.background = "#ef4444"; // red-500
        closeBtn.cornerRadius = 50;
        closeBtn.fontSize = 40;
        closeBtn.onPointerClickObservable.add(() => this.dispose());
        footerCont.addControl(closeBtn);

        // Positioning
        this.positionPanel(scene, xrHelper, anchorMesh);
    }

    // --- HELPER: Special Header Box (ID, Source, Target) ---
    private createSpecialBox(label: string, value: any, textColor: string, bgColor: string, borderColor: string): GUI.Container {
        const container = new GUI.Rectangle();
        container.height = "150px";
        container.width = "100%";
        container.background = bgColor;
        container.color = borderColor; // border color
        container.thickness = 2;
        container.cornerRadius = 20;
        container.paddingLeft = "20px";
        container.paddingRight = "20px";

        const stack = new GUI.StackPanel();
        stack.isVertical = true;
        stack.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        container.addControl(stack);

        const lbl = new GUI.TextBlock();
        lbl.text = label;
        lbl.color = textColor;
        lbl.fontSize = 24;
        lbl.fontWeight = "bold";
        lbl.height = "40px";
        lbl.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        stack.addControl(lbl);

        const val = new GUI.TextBlock();
        val.text = String(value);
        val.color = this.theme.text;
        val.fontSize = 34; // Monospace-ish feel
        val.fontFamily = "Monospace, Consolas, Courier New";
        val.height = "50px";
        val.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        stack.addControl(val);

        return container;
    }

    // --- HELPER: Property Block Generator ---
    private createPropertyBlock(key: string, value: any, type: string): GUI.Control {
        const wrapper = new GUI.StackPanel();
        wrapper.isVertical = true;
        wrapper.height = "auto";
        wrapper.paddingBottom = "30px";
        wrapper.paddingLeft = "20px";
        wrapper.paddingRight = "20px";

        // Title Row
        const titleRow = new GUI.StackPanel();
        titleRow.isVertical = false;
        titleRow.height = "40px";
        titleRow.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        wrapper.addControl(titleRow);

        // Indicator Pill
        const pill = new GUI.Rectangle();
        pill.width = "10px";
        pill.height = "25px";
        pill.background = (Array.isArray(value)) ? this.theme.arrayColor :
            (type === 'node' ? this.theme.nodePrimary : this.theme.edgePrimary);
        pill.thickness = 0;
        pill.cornerRadius = 4;
        titleRow.addControl(pill);

        // Key Text
        const keyTxt = new GUI.TextBlock();
        keyTxt.text = key.toUpperCase();
        keyTxt.color = pill.background;
        keyTxt.fontSize = 28;
        keyTxt.fontWeight = "bold";
        keyTxt.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        keyTxt.paddingLeft = "15px";
        keyTxt.resizeToFit = true;
        titleRow.addControl(keyTxt);

        // Content Area
        const contentArea = new GUI.StackPanel();
        contentArea.isVertical = true;
        contentArea.paddingLeft = "25px"; // Indent
        contentArea.paddingTop = "10px";

        // Border Line on Left
        const leftBorder = new GUI.Rectangle();
        leftBorder.width = "2px";
        leftBorder.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftBorder.background = this.theme.border;
        // Babylon GUI doesn't easily support "full height left border" inside a stack that grows.
        // Instead we just indent.

        if (Array.isArray(value)) {
            // ARRAY handling
            value.forEach(item => {
                const itemContainer = new GUI.Rectangle();
                itemContainer.adaptHeightToChildren = true;
                itemContainer.thickness = 0;
                itemContainer.background = this.theme.codeBg;
                itemContainer.paddingBottom = "5px";
                itemContainer.width = "100%";
                itemContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

                const itemTxt = new GUI.TextBlock();
                itemTxt.text = `• ${typeof item === 'object' ? JSON.stringify(item) : String(item)}`;
                itemTxt.color = this.theme.textMuted;
                itemTxt.fontSize = 26;
                itemTxt.textWrapping = true;
                itemTxt.resizeToFit = true;
                itemTxt.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

                itemContainer.addControl(itemTxt);
                contentArea.addControl(itemContainer);
            });
        } else if (typeof value === 'object' && value !== null) {
            // NESTED OBJECT handling
            Object.entries(value).forEach(([nKey, nVal]) => {
                const row = new GUI.StackPanel();
                row.isVertical = true;
                row.paddingBottom = "10px";

                const k = new GUI.TextBlock();
                k.text = nKey + ":";
                k.color = this.theme.textMuted;
                k.fontSize = 24;
                k.resizeToFit = true;
                k.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                row.addControl(k);

                const valContainer = new GUI.Rectangle();
                valContainer.adaptHeightToChildren = true;
                valContainer.thickness = 0;
                valContainer.background = this.theme.codeBg;
                valContainer.width = "100%";
                valContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

                const v = new GUI.TextBlock();
                v.text = typeof nVal === 'object' ? JSON.stringify(nVal, null, 2) : String(nVal);
                v.color = this.theme.text;
                v.fontSize = 26;
                v.fontFamily = "Monospace";
                v.textWrapping = true;
                v.resizeToFit = true;
                v.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

                valContainer.addControl(v);
                row.addControl(valContainer);

                contentArea.addControl(row);
            });
        } else {
            // SIMPLE VALUE
            const valContainer = new GUI.Rectangle();
            valContainer.adaptHeightToChildren = true;
            valContainer.thickness = 0;
            valContainer.background = this.theme.codeBg;
            valContainer.width = "100%";
            valContainer.paddingTop = "5px";
            valContainer.paddingBottom = "5px";
            valContainer.paddingLeft = "10px";
            valContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

            const valTxt = new GUI.TextBlock();
            valTxt.text = String(value);
            valTxt.color = this.theme.text;
            valTxt.fontSize = 30;
            valTxt.fontFamily = "Monospace";
            valTxt.textWrapping = true;
            valTxt.resizeToFit = true;
            valTxt.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

            valContainer.addControl(valTxt);
            contentArea.addControl(valContainer);
        }

        wrapper.addControl(contentArea);
        return wrapper;
    }

    private positionPanel(scene: Scene, xrHelper: any, anchorMesh: any) {
        let camera = scene.activeCamera;
        if (xrHelper && xrHelper.baseExperience && xrHelper.baseExperience.camera) {
            camera = xrHelper.baseExperience.camera;
        }

        if (camera && anchorMesh) {
            const nodePos = anchorMesh.absolutePosition;
            const camPos = camera.position;
            const direction = camPos.subtract(nodePos).normalize();

            // 1.5m away, slightly up
            const targetPos = nodePos.add(direction.scale(1.5)).add(new Vector3(0, 0.3, 0));
            this.panelMesh!.position = targetPos;
            this.panelMesh!.lookAt(camPos);
            this.panelMesh!.rotation.y += Math.PI;
        } else if (camera) {
            const front = camera.getDirection(Vector3.Forward());
            this.panelMesh!.position = camera.position.add(front.scale(2.0));
            this.panelMesh!.lookAt(camera.position);
            this.panelMesh!.rotation.y += Math.PI;
        }
    }

    dispose() {
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
