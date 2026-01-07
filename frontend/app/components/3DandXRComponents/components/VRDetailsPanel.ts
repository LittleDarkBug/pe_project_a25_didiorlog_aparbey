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
        // Nettoyage propre
        this.dispose();
        if (!data) return;
        this.scene = scene;

        console.log("VRDetailsPanel: Creating Safe Panel");

        // 1. CRÉATION DU MESH
        this.panelMesh = MeshBuilder.CreatePlane("VR_UI_Panel", { width: 1.5, height: 1.5 }, scene);

        // 2. CRÉATION DE LA TEXTURE
        this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(this.panelMesh, 1024, 1024);

        // CRITICAL FIX: Force full texture rendering (no alpha channel issues)
        this.texture.hasAlpha = false;
        this.texture.renderScale = 1; // Ensure full resolution

        // 3. SÉCURISATION DU MATÉRIAU (CRITIQUE)
        const mat = this.panelMesh.material as StandardMaterial;
        if (mat) {
            mat.disableLighting = true;
            // Reduced brightness for VR comfort - not pure white
            mat.emissiveColor = new Color3(0.6, 0.6, 0.65);
            mat.backFaceCulling = false;
            // Force diffuse texture to be used (not just emissive)
            mat.diffuseColor = new Color3(0.8, 0.8, 0.85);
        }

        // 4. PARENT TO XR CAMERA (The "1 unit away as child of WebXR camera" pattern)
        // This ensures the mesh is always in the camera's render list
        let xrCamera = null;
        if (xrHelper && xrHelper.baseExperience && xrHelper.baseExperience.camera) {
            xrCamera = xrHelper.baseExperience.camera;
            this.panelMesh.parent = xrCamera;
            // Position relative to camera (1.5m in front)
            this.panelMesh.position = new Vector3(0, 0, 1.5);
            // Billboard mode so it faces the user
            this.panelMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
        } else if (scene.activeCamera) {
            // Fallback for non-VR
            this.placePanel(scene, xrHelper);
        }

        // 5. PROTECTION CONTRE LE BLOOM/GLOW
        const glowLayer = scene.effectLayers?.find(l => l.getClassName() === "GlowLayer") as GlowLayer;
        if (glowLayer) {
            glowLayer.addExcludedMesh(this.panelMesh);
        }

        // 6. CONSTRUCTION DE L'INTERFACE (GUI)
        const container = new GUI.Rectangle();
        container.width = 1;
        container.height = 1;
        container.cornerRadius = 40;
        container.color = "#00FFFF"; // Cyan
        container.thickness = 4;
        // Fond sombre très opaque pour éviter la transparence confuse en VR
        container.background = "rgb(20, 20, 30)";
        container.alpha = 0.95; // Gestion alpha via le conteneur GUI, plus sûr
        this.texture.addControl(container);

        // --- HEADER ---
        const header = new GUI.TextBlock();
        header.text = (type === 'node' ? "NODE: " : "EDGE: ") + (data.id || "Unknown");
        header.color = "white";
        header.fontSize = 60;
        header.fontFamily = "Consolas, monospace";
        header.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        header.top = "30px";
        header.height = "100px";
        container.addControl(header);

        // --- SCROLLVIEWER ---
        const sv = new GUI.ScrollViewer();
        sv.width = 0.9;
        sv.height = 0.7;
        sv.top = -50;
        sv.color = "white";
        sv.thickness = 0;
        sv.barSize = 20;
        sv.barColor = "#00FFFF";
        container.addControl(sv);

        // --- STACKPANEL ---
        const stackPanel = new GUI.StackPanel();
        stackPanel.width = "100%";
        sv.addControl(stackPanel);

        // --- DATA ROWS ---
        // Filtrage des données techniques
        const entries = Object.entries(data)
            .filter(([k]) => !['x', 'y', 'z', 'fx', 'fy', 'fz', '__index', 'geometryId', 'vx', 'vy', 'vz'].includes(k));

        entries.forEach(([key, value]) => {
            const row = new GUI.Grid();
            row.height = "80px";
            row.width = "100%";
            row.addColumnDefinition(0.4);
            row.addColumnDefinition(0.6);

            const keyText = new GUI.TextBlock();
            keyText.text = key.toUpperCase() + ":";
            keyText.color = "#AAAAAA";
            keyText.fontSize = 35;
            keyText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            keyText.paddingRight = "20px";
            row.addControl(keyText, 0, 0);

            const valText = new GUI.TextBlock();
            // Handle nested objects properly - format as JSON
            let displayValue: string;
            if (typeof value === 'object' && value !== null) {
                try {
                    const jsonStr = JSON.stringify(value, null, 2);
                    // Truncate if too long for readability
                    displayValue = jsonStr.length > 100 ? jsonStr.substring(0, 97) + '...' : jsonStr;
                } catch {
                    displayValue = '[Complex Object]';
                }
            } else {
                displayValue = String(value ?? 'N/A');
            }
            valText.text = displayValue;
            valText.color = "#FFFFFF";
            valText.fontSize = 35;
            valText.fontWeight = "bold";
            valText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            valText.textWrapping = true;
            row.addControl(valText, 0, 1);

            stackPanel.addControl(row);

            const line = new GUI.Rectangle();
            line.height = "2px";
            line.width = "90%";
            line.color = "#333333";
            line.background = "#333333";
            stackPanel.addControl(line);
        });

        // --- BOUTON FERMER ---
        const closeBtn = GUI.Button.CreateSimpleButton("closeBtn", "FERMER");
        closeBtn.width = "300px";
        closeBtn.height = "80px";
        closeBtn.color = "white";
        closeBtn.background = "#ef4444";
        closeBtn.cornerRadius = 20;
        closeBtn.fontSize = 40;
        closeBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.top = "-30px";
        closeBtn.onPointerClickObservable.add(() => {
            this.dispose();
        });
        container.addControl(closeBtn);

        // 6. POSITIONNEMENT
        this.placePanel(scene, xrHelper);
    }

    private placePanel(scene: Scene, xrHelper: any) {
        if (!this.panelMesh) return;

        let camera = scene.activeCamera;
        // Priorité à la caméra VR
        if (xrHelper && xrHelper.baseExperience && xrHelper.baseExperience.camera) {
            camera = xrHelper.baseExperience.camera;
        }

        if (camera) {
            // Position : 1.5m devant
            const forward = camera.getDirection(Vector3.Forward());
            const pos = camera.position.add(forward.scale(1.5));
            // Optionnel : Verrouiller la hauteur pour confort (éviter de lever la tête)
            // pos.y = camera.position.y;

            this.panelMesh.position = pos;

            // Orientation
            this.panelMesh.lookAt(camera.position);
            // Retourner car Plane regarde -Z
            this.panelMesh.rotation.y += Math.PI;

            // Billboard pour suivre l'utilisateur
            this.panelMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
        }
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