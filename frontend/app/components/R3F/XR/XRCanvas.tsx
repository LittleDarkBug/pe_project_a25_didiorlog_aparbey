'use client';

import { Canvas } from '@react-three/fiber';
import { XR, XROrigin } from '@react-three/xr';
import { Stars } from '@react-three/drei';
import { Suspense, ReactNode, useState, useEffect, Component, ErrorInfo } from 'react';
import { xrStore } from './store'; // Import shared store
import { VRButton } from '@react-three/xr';

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

export default function XRCanvas({ children, className }: XRCanvasProps) {
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
            {/* 
                We use the official VRButton from @react-three/xr.
                This allows the user to enter WR mode only when supported.
                The button handles the store interaction automatically.
            */}
            {/* 
                We use the official VRButton from @react-three/xr.
                This allows the user to enter WR mode only when supported.
                The button handles the store interaction automatically.
                Styled to ensure it appears above other overlays.
            */}
            <VRButton
                store={xrStore}
                style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999, // Ensure it's above everything
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
                        <XROrigin position={[0, 0, 0]} />

                        {/* Immersive Lighting */}
                        <ambientLight intensity={0.4} />
                        <directionalLight position={[10, 20, 10]} intensity={1.2} color="#ffffff" />
                        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#4080ff" />
                        <pointLight position={[10, 5, 10]} intensity={0.5} color="#ff8040" />

                        <Suspense fallback={null}>
                            {/* Vast Space Environment */}
                            <color attach="background" args={['#050508']} />
                            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                            {/* Subtle Floor Grid to give spatial reference */}
                            <gridHelper args={[50, 50, 0x444444, 0x111111]} position={[0, 0, 0]} />

                            {children}
                        </Suspense>
                    </XR>
                </Canvas>
            </XRErrorBoundary>
        </div>
    );
}
