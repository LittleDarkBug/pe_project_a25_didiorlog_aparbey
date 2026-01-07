import { createXRStore } from '@react-three/xr';

export const xrStore = createXRStore({
    foveation: 1,
    frameRate: 'high',
    // @ts-ignore - sessionInit is supported in runtime v6 despite missing type definition
    sessionInit: {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
    }
});
