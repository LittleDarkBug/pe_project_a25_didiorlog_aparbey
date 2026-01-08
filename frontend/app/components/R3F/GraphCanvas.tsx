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
                    {/* Lighting - Matching BabylonJS exactly */}
                    {/* HemisphericLight equivalent: Ambient + Directional */}
                    <ambientLight intensity={0.4} color="#e6e6ff" /> {/* Diffuse 0.9,0.9,1 * 0.4 */}
                    <directionalLight position={[0, 100, 0]} intensity={0.4} color="#ffffff" /> {/* Specular high */}

                    {/* DirectionalLight -1,-2,-1 */}
                    <directionalLight position={[-10, -20, -10]} intensity={0.2} color="#ccccE6" /> {/* Cool blue-ish */}

                    {/* Environment */}
                    {/* SpaceSphere equivalent: Background color + Stars */}
                    <color attach="background" args={['#030308']} /> {/* 0.01, 0.01, 0.03 */}
                    <Stars radius={300} depth={100} count={5000} factor={4} saturation={0} fade speed={1} />

                    {/* Controls - Standard OrbitControls for Web */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={0.1}
                        maxDistance={10000}
                        zoomSpeed={1.0}
                        panSpeed={1.0}
                        rotateSpeed={1.0}
                    />

                    {/* Graph Content */}
                    {children}
                </Suspense>
            </Canvas>
        </div>
    );
}
