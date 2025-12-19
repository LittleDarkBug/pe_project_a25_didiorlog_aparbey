import { WebXRFeatureName } from '@babylonjs/core';

export function useVRLocomotion() {
    const setupLocomotion = (featuresManager: any, xr: any) => {
        // 1. Enable Free Movement (Flying)
        // Since we are in a space graph (no floor), we want to fly in the direction we are looking/pointing.
        try {
            const movementFeature = featuresManager.enableFeature(
                WebXRFeatureName.MOVEMENT,
                'latest',
                {
                    xrInput: xr.input,
                    // High speed for large graph traversal
                    movementSpeed: 20.0, 
                    rotationSpeed: 0.5,
                    // Fly in the direction of the viewer/controller
                    movementOrientationFollowsViewerPose: true,
                    // Disable gravity/ground check for flying
                    enablePhysics: false 
                }
            );
            
            // Ensure movement is enabled
            if (movementFeature) {
                movementFeature.movementEnabled = true;
            }
            
            console.log("VR Flying Movement enabled");
        } catch (e) {
            console.error("Failed to enable VR Movement", e);
        }

        // 2. Pointer Selection is usually enabled by default in createDefaultXRExperienceAsync.
        // We can configure it if needed, but re-enabling it might cause duplicates.
        // We just ensure the existing one is configured correctly if accessible.
        try {
             // If we need to force it or configure it:
             const pointerSelection = featuresManager.getEnabledFeature(WebXRFeatureName.POINTER_SELECTION);
             if (pointerSelection) {
                 pointerSelection.displayLaserPointer = true;
                 pointerSelection.selectionMeshPickedPointEnabled = true;
             }
        } catch (e) {
            console.log("Could not configure pointer selection", e);
        }

        // 3. Disable Near Interaction for now to avoid conflicts with Ray Selection in large scenes
        // (Unless specifically requested for UI interaction close up)
    };

    return { setupLocomotion };
}
