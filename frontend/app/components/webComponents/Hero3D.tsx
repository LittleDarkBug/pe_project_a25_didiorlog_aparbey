'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Animated nodes for the hero section
 */
function HeroNodes() {
    const groupRef = useRef<THREE.Group>(null);

    // Generate random node positions on a sphere
    const nodeData = useMemo(() => {
        const nodes: THREE.Vector3[] = [];
        const nodeCount = 15;
        const r = 5;

        for (let i = 0; i < nodeCount; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            nodes.push(new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            ));
        }
        return nodes;
    }, []);

    // Generate edges between nearby nodes
    const edges = useMemo(() => {
        const lines: [THREE.Vector3, THREE.Vector3][] = [];
        for (let i = 0; i < nodeData.length; i++) {
            for (let j = i + 1; j < nodeData.length; j++) {
                if (nodeData[i].distanceTo(nodeData[j]) < 4) {
                    lines.push([nodeData[i], nodeData[j]]);
                }
            }
        }
        return lines;
    }, [nodeData]);

    // Slow rotation animation
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Nodes */}
            {nodeData.map((pos, i) => (
                <mesh key={`node-${i}`} position={pos}>
                    <sphereGeometry args={[0.25, 16, 16]} />
                    <meshBasicMaterial color="#3399ff" />
                </mesh>
            ))}

            {/* Edges */}
            {edges.map((edge, i) => (
                <Line
                    key={`edge-${i}`}
                    points={edge}
                    color="#3399ff"
                    lineWidth={1}
                    transparent
                    opacity={0.3}
                />
            ))}
        </group>
    );
}

/**
 * Composant Héros 3D pour la landing page.
 * Affiche une animation abstraite de graphe.
 */
export default function Hero3D() {
    return (
        <div className="h-full w-full">
            <Canvas
                camera={{ position: [10, 8, 10], fov: 50 }}
                gl={{ alpha: true, antialias: true }}
                style={{ background: 'transparent' }}
            >
                {/* Lighting */}
                <ambientLight intensity={0.8} />

                {/* Content */}
                <HeroNodes />
            </Canvas>
        </div>
    );
}
