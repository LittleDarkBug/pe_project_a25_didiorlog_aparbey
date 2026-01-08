'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { XR, XROrigin } from '@react-three/xr';
import { Suspense, ReactNode, Component, ErrorInfo, useRef, createContext, useContext } from 'react';
import { xrStore } from './store';
import { VRButton } from '@react-three/xr';
import * as THREE from 'three';

interface XRCanvasProps {
    children: ReactNode;
    className?: string;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: string | null;
}

// Context to share the origin ref with child components
export const XROriginContext = createContext<React.RefObject<THREE.Group | null> | null>(null);

export function useXROriginRef() {
    return useContext(XROriginContext);
}

class XRErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error: error.message };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('XR Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

// Inner component that provides origin ref via context
function XRSceneContent({ children, originRef }: { children: ReactNode, originRef: React.RefObject<THREE.Group | null> }) {
    return (
        <XROriginContext.Provider value={originRef}>
            <XROrigin ref={originRef} position={[0, 0, 0]} />

            {/* Immersive Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
            <pointLight position={[-10, 5, -10]} intensity={1} color="#4080ff" />
            <pointLight position={[10, 5, 10]} intensity={1} color="#ff8040" />

            <Suspense fallback={null}>
                {/* Vast Black Environment */}
                <color attach="background" args={['#000000']} />
                <gridHelper args={[50, 50, 0x222222, 0x050505]} position={[0, -2, 0]} />

                {children}
            </Suspense>
        </XROriginContext.Provider>
    );
}

export default function XRCanvas({ children, className }: XRCanvasProps) {
    const originRef = useRef<THREE.Group | null>(null);

    const xrFallback = (
        <div className="h-full w-full flex items-center justify-center bg-black text-white">
            <div className="text-center p-8">
                <p className="text-xl mb-2">Mode XR non disponible</p>
                <p className="text-sm text-gray-400">Utilisez le mode web standard</p>
            </div>
        </div>
    );

    return (
        <div className={className || "h-full w-full relative"}>
            <VRButton
                store={xrStore}
                {...({
                    sessionInit: {
                        // Minimal features for polyfill compatibility
                        optionalFeatures: ['local']
                    }
                } as any)}
                style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    padding: '12px 24px',
                    border: '1px solid white',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    font: 'bold 16px sans-serif',
                    cursor: 'pointer'
                }}
            />

            <XRErrorBoundary fallback={xrFallback}>
                <Canvas
                    camera={{ position: [0, 1.6, 5], fov: 70 }}
                    gl={{ antialias: true, alpha: false }}
                >
                    <XR store={xrStore}>
                        <XRSceneContent originRef={originRef}>
                            {children}
                        </XRSceneContent>
                    </XR>
                </Canvas>
            </XRErrorBoundary>
        </div>
    );
}
