'use client';

import { useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Text, Billboard } from '@react-three/drei';
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

    // Optimization: Update instances only when data or selection changes, NOT every frame
    useLayoutEffect(() => {
        if (!meshRef.current) return;

        const tempObject = new THREE.Object3D();
        const tempColor = new THREE.Color();

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
            const baseColor = node.color || '#60a5fa'; // Lighter blue default
            let finalColor = baseColor;
            if (selectedNodeId === node.id) finalColor = '#fbbf24';
            else if (hoveredId === i) finalColor = '#93c5fd'; // Very light blue on hover

            tempColor.set(finalColor);
            meshRef.current!.setColorAt(i, tempColor);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    }, [nodes, selectedNodeId, hoveredId]); // Only re-run when these change

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
                <sphereGeometry args={[nodeSize, 32, 32]} />
                <meshStandardMaterial
                    metalness={0.8}
                    roughness={0.1}
                    emissive="#4080ff"
                    emissiveIntensity={0.8}
                    toneMapped={false} // Important for bloom to work well
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
                    <div className="px-2 py-0.5 text-white text-xs font-semibold drop-shadow-md" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
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
                    <div className="px-3 py-1.5 bg-slate-900/90 text-blue-200 text-sm font-medium rounded-lg backdrop-blur-md border border-slate-700/50 shadow-xl transform translate-y-[-10px]">
                        {nodeMap.get(hoveredId)!.label || nodeMap.get(hoveredId)!.id}
                    </div>
                </Html>
            )}

            {/* VR Labels (3D Text with Billboard) */}
            {isVR && (showLabels || hoveredId !== null) && nodes.map((node, i) => {
                const isHovered = hoveredId === i;
                if (!showLabels && !isHovered) return null;

                return (
                    <Billboard
                        key={`vr-label-${node.id}`}
                        position={[node.x || 0, (node.y || 0) + nodeSize + 1.2, node.z || 0]}
                        follow={true}
                        lockX={false}
                        lockY={false}
                        lockZ={false}
                    >
                        <Text
                            fontSize={isHovered ? 1.2 : 0.8}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.05}
                            outlineColor="#000000"
                        >
                            {node.label || node.id}
                        </Text>
                    </Billboard>
                );
            })}
        </group>
    );
}
