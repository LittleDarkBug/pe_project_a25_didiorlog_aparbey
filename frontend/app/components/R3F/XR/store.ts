import { createXRStore } from '@react-three/xr';

export const xrStore = createXRStore({
    foveation: 1,
    frameRate: 'high',
    // Disable the built-in emulator to avoid interference with custom extension
    emulate: false,
    // Disable features that may not be supported by custom polyfills
    handTracking: false,
    // Disable controller to let polyfill handle it directly
    controller: true,
});
