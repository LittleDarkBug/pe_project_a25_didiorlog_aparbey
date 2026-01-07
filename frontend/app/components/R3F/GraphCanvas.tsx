'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, ReactNode } from 'react';

interface GraphCanvasProps {
    children: ReactNode;
    className?: string;
}

/**
 * Standard R3F Canvas wrapper for graph visualization (Web Mode).
 * No XR support here - strictly for desktop/mobile 2D web usage.
 */
export default function GraphCanvas({ children, className }: GraphCanvasProps) {
    return (
        <div className={className || "h-full w-full"}>
            <Canvas
                camera={{ position: [0, 50, 100], fov: 60 }}
                gl={{ antialias: true, alpha: false }}
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 20, 10]} intensity={0.6} />
                    <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4080ff" />

                    {/* Environment */}
                    <Stars radius={300} depth={100} count={2000} factor={6} fade speed={0.5} />
                    <color attach="background" args={['#030308']} />

                    {/* Controls - Standard OrbitControls for Web */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={1}
                        maxDistance={500}
                    />

                    {/* Graph Content */}
                    {children}
                </Suspense>
            </Canvas>
        </div>
    );
}
