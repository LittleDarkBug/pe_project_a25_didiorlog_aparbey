import { createXRStore } from '@react-three/xr';

export const xrStore = createXRStore({
    // Display settings - Quality optimized for Quest 3
    foveation: 0,  // 0 = disable foveation for sharper image (1 = max foveation, blurry periphery)
    frameRate: 'high',
    frameBufferScaling: 1.5,  // Higher resolution (1.0 = native, 1.5 = 50% more pixels)

    // Disable emulator for real hardware
    emulate: false,

    // Controller configuration - use default XR controllers with pointer
    controller: true,

    // Hand tracking - enable for Quest 3
    handTracking: true,

    // Additional features for Quest 3
    anchors: false,
    meshDetection: false,
    planeDetection: false,
    depthSensing: false,
    hitTest: false,
});

