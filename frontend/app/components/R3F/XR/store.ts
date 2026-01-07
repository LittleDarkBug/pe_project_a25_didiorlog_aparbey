import { createXRStore } from '@react-three/xr';

export const xrStore = createXRStore({
    foveation: 1,
    frameRate: 'high',
    sessionInit: {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
    }
});
