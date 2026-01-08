import { createXRStore } from '@react-three/xr';

// Minimal configuration - based on official @react-three/xr examples
// Most options use sensible defaults when not specified
export const xrStore = createXRStore({
    // Quality settings for Quest 3
    foveation: 0,        // Disable foveation for sharper image
    frameRate: 'high',   // Request high frame rate

    // Essential: disable emulator for real hardware
    emulate: false,
});
