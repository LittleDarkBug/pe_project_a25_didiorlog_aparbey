import { WebXRFeatureName } from '@babylonjs/core';

export function useVRLocomotion() {
    const setupLocomotion = (featuresManager: any, xr: any) => {
        // Movement locomotion using proper feature name
        try {
            const movementFeature = featuresManager.enableFeature(
                WebXRFeatureName.MOVEMENT,
                'latest',
                {
                    xrInput: xr.input,
                    movementSpeed: 2.0,
                    rotationSpeed: 1.5
                }
            );
            console.log("Movement feature enabled", movementFeature);
        } catch (e) {
            console.log("Movement unavailable, trying walking locomotion", e);
            // Fallback to walking locomotion
            try {
                const walkingFeature = featuresManager.enableFeature(
                    WebXRFeatureName.WALKING_LOCOMOTION,
                    'latest',
                    {
                        locomotionTarget: xr.baseExperience.camera
                    }
                );
                console.log("Walking locomotion enabled", walkingFeature);
            } catch (err) {
                console.log("Walking locomotion also unavailable");
            }
        }

        // Pointer selection with proper feature name
        try {
            const pointerFeature = featuresManager.enableFeature(
                WebXRFeatureName.POINTER_SELECTION,
                'stable',
                {
                    xrInput: xr.input,
                    enablePointerSelectionOnAllControllers: true
                }
            );
            console.log("Pointer selection enabled", pointerFeature);
        } catch (e) {
            console.log("Pointer selection unavailable", e);
        }

        // Near interaction with proper feature name
        try {
            const nearFeature = featuresManager.enableFeature(
                WebXRFeatureName.NEAR_INTERACTION,
                'stable',
                {
                    xrInput: xr.input,
                    enableNearInteractionOnAllControllers: true,
                    nearInteractionMode: 'grab'
                }
            );
            console.log("Near interaction enabled", nearFeature);
        } catch (e) {
            console.log("Near interaction unavailable", e);
        }
    };

    return { setupLocomotion };
}
