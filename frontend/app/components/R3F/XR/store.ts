import { createXRStore } from '@react-three/xr';

// Minimal configuration - based on official @react-three/xr examples
// Most options use sensible defaults when not specified
export const xrStore = createXRStore({
    // Quality settings for Quest 3
    foveation: 0,        // Disable foveation for sharper image
    frameRate: 'high',   // Request high frame rate

    // Essential: disable emulator for real hardware
    emulate: false,

    // Explicitly disable features not supported in immersive-vr or causing issues
    domOverlay: false,
    meshDetection: false,
    planeDetection: false,
    depthSensing: false,
    anchors: false,

    // Ensure controllers are prioritized for debugging
    controller: true,
    hand: false, // Temporarily disable hands to isolate controller detection issues

    // Explicitly disable layers to avoid "Unsupported feature requested: layers"
    layers: false,
    // Disable other potentially problematic features
    hitTest: false,
});
