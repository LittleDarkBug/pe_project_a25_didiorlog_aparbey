'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';

interface NodeData {
    id: string;
    x: number;
    y: number;
    z: number;
    color?: string;
    label?: string;
    [key: string]: any;
}

interface GraphNodesProps {
    nodes: NodeData[];
    nodeSize?: number;
    onNodeClick?: (node: NodeData) => void;
    selectedNodeId?: string | null;
    showLabels?: boolean;
    isVR?: boolean;
}

/**
 * Instanced mesh component for efficient node rendering.
 * Uses THREE.InstancedMesh for performance with large graphs.
 */
export default function GraphNodes({
    nodes,
    nodeSize = 1.5,
    onNodeClick,
    selectedNodeId,
    showLabels = false,
    isVR = false
}: GraphNodesProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // Create node map for lookups
    const nodeMap = useMemo(() => {
        const map = new Map<number, NodeData>();
        nodes.forEach((node, i) => map.set(i, node));
        return map;
    }, [nodes]);

    // Update instance matrices on each frame
    useFrame(() => {
        if (!meshRef.current) return;

        nodes.forEach((node, i) => {
            tempObject.position.set(node.x || 0, node.y || 0, node.z || 0);

            // Scale up selected or hovered node
            let scale = 1;
            if (selectedNodeId === node.id) scale = 1.5;
            else if (hoveredId === i) scale = 1.3;
            tempObject.scale.setScalar(scale);

            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);

            // Update color based on state
            const baseColor = node.color || '#3b82f6';
            let finalColor = baseColor;
            if (selectedNodeId === node.id) finalColor = '#fbbf24';
            else if (hoveredId === i) finalColor = '#60a5fa';

            tempColor.set(finalColor);
            meshRef.current!.setColorAt(i, tempColor);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    });

    const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const instanceId = event.instanceId;
        if (instanceId !== undefined && nodeMap.has(instanceId)) {
            onNodeClick?.(nodeMap.get(instanceId)!);
        }
    }, [nodeMap, onNodeClick]);

    const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const instanceId = event.instanceId;
        if (instanceId !== undefined) {
            setHoveredId(instanceId);
            if (!isVR) document.body.style.cursor = 'pointer';
        }
    }, [isVR]);

    const handlePointerOut = useCallback(() => {
        setHoveredId(null);
        if (!isVR) document.body.style.cursor = 'auto';
    }, [isVR]);

    if (nodes.length === 0) return null;

    return (
        <group>
            <instancedMesh
                ref={meshRef}
                args={[undefined, undefined, nodes.length]}
                onClick={handleClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            >
                <sphereGeometry args={[nodeSize, 16, 16]} />
                <meshStandardMaterial
                    metalness={0.3}
                    roughness={0.4}
                    emissive="#1e40af"
                    emissiveIntensity={0.2}
                />
            </instancedMesh>

            {/* Labels (Web only) */}
            {!isVR && showLabels && nodes.map((node, i) => (
                <Html
                    key={`label-${node.id}`}
                    position={[node.x || 0, (node.y || 0) + nodeSize + 0.5, node.z || 0]}
                    center
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap backdrop-blur-sm border border-white/20">
                        {node.label || node.id}
                    </div>
                </Html>
            ))}

            {/* Hover tooltip (Web only) */}
            {!isVR && !showLabels && hoveredId !== null && nodeMap.has(hoveredId) && (
                <Html
                    position={[
                        nodeMap.get(hoveredId)!.x || 0,
                        (nodeMap.get(hoveredId)!.y || 0) + nodeSize + 0.5,
                        nodeMap.get(hoveredId)!.z || 0
                    ]}
                    center
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="px-3 py-2 bg-blue-600/90 text-white text-sm rounded-lg whitespace-nowrap backdrop-blur-sm border border-blue-400/50 shadow-lg">
                        {nodeMap.get(hoveredId)!.label || nodeMap.get(hoveredId)!.id}
                    </div>
                </Html>
            )}

            {/* VR Labels (3D Text) */}
            {isVR && (showLabels || hoveredId !== null) && nodes.map((node, i) => {
                const isHovered = hoveredId === i;
                if (!showLabels && !isHovered) return null;

                return (
                    <Text
                        key={`vr-label-${node.id}`}
                        position={[node.x || 0, (node.y || 0) + nodeSize + 0.8, node.z || 0]}
                        fontSize={0.5}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.02}
                        outlineColor="#000000"
                    >
                        {node.label || node.id}
                    </Text>
                );
            })}
        </group>
    );
}
