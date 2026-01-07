'use client';

import { useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';

interface NodeData {
    id: string;
    x: number;
    y: number;
    z: number;
    [key: string]: any;
}

interface EdgeData {
    source: string;
    target: string;
    weight?: number;
    [key: string]: any;
}

interface GraphEdgesProps {
    edges: EdgeData[];
    nodes: NodeData[];
    edgeColor?: string;
    edgeOpacity?: number;
    onEdgeClick?: (edge: EdgeData) => void;
    isVR?: boolean;
}

/**
 * Edge rendering component using drei's Line.
 * Creates line segments between connected nodes.
 */
// Helper component for volumetric edges using properties of standard Cylinders
// Optimized to avoid re-calculating geometry every frame, but calculating transforms
function CylinderEdge({ start, end, color, opacity, hovered, onClick, onPointerOver, onPointerOut }: any) {
    const ref = useMemo(() => {
        const diff = new THREE.Vector3().subVectors(end, start);
        const length = diff.length();
        const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        // Oriental aligned with Y axis
        const quaternion = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        // If vector is zero-length, standard q.
        if (length > 0.0001) {
            quaternion.setFromUnitVectors(up, diff.clone().normalize());
        }

        return { position, quaternion, length };
    }, [start, end]);

    return (
        <mesh
            position={ref.position}
            quaternion={ref.quaternion}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
        >
            <cylinderGeometry args={[0.05, 0.05, ref.length, 6]} />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={hovered ? color : '#000000'}
                emissiveIntensity={hovered ? 0.5 : 0}
            />
        </mesh>
    );
}

export default function GraphEdges({
    edges,
    nodes,
    edgeColor = '#64748b',
    edgeOpacity = 0.6,
    onEdgeClick,
    isVR = false
}: GraphEdgesProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Create node position lookup
    const nodePositions = useMemo(() => {
        const map = new Map<string, THREE.Vector3>();
        nodes.forEach(node => {
            map.set(node.id, new THREE.Vector3(node.x || 0, node.y || 0, node.z || 0));
        });
        return map;
    }, [nodes]);

    // Create line segments for all edges
    const segments = useMemo(() => {
        const segs: { start: THREE.Vector3; end: THREE.Vector3; edge: EdgeData }[] = [];

        edges.forEach(edge => {
            const sourcePos = nodePositions.get(edge.source);
            const targetPos = nodePositions.get(edge.target);

            if (sourcePos && targetPos) {
                segs.push({
                    start: sourcePos,
                    end: targetPos,
                    edge
                });
            }
        });

        return segs;
    }, [edges, nodePositions]);

    const handlePointerOver = useCallback((index: number) => {
        setHoveredIndex(index);
        if (!isVR) document.body.style.cursor = 'pointer';
    }, [isVR]);

    const handlePointerOut = useCallback(() => {
        setHoveredIndex(null);
        if (!isVR) document.body.style.cursor = 'auto';
    }, [isVR]);

    if (segments.length === 0) return null;

    return (
        <group>
            {segments.map((segment, i) => (
                <CylinderEdge
                    key={`edge-${i}`}
                    start={segment.start}
                    end={segment.end}
                    color={hoveredIndex === i ? '#a855f7' : edgeColor}
                    opacity={hoveredIndex === i ? 1 : edgeOpacity}
                    hovered={hoveredIndex === i}
                    onClick={(e: ThreeEvent<MouseEvent>) => {
                        e.stopPropagation();
                        onEdgeClick?.(segment.edge);
                    }}
                    onPointerOver={() => handlePointerOver(i)}
                    onPointerOut={handlePointerOut}
                />
            ))}
        </group>
    );
}
