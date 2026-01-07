'use client';

import { useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';

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
 * Optimized Edge rendering using THREE.InstancedMesh.
 * Reduces draw calls from N to 1, capable of rendering thousands of edges at 60FPS.
 */
export default function GraphEdges({
    edges,
    nodes,
    edgeColor = '#64748b',
    edgeOpacity = 0.6,
    onEdgeClick,
    isVR = false
}: GraphEdgesProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // Create node position lookup for O(1) access
    const nodePositions = useMemo(() => {
        const map = new Map<string, THREE.Vector3>();
        nodes.forEach(node => {
            map.set(node.id, new THREE.Vector3(node.x || 0, node.y || 0, node.z || 0));
        });
        return map;
    }, [nodes]);

    // Valid edges list (both nodes exist)
    const validEdges = useMemo(() => {
        return edges.filter(e => nodePositions.has(e.source) && nodePositions.has(e.target));
    }, [edges, nodePositions]);

    // Update instances - only re-run if graph data changes
    useLayoutEffect(() => {
        if (!meshRef.current) return;

        validEdges.forEach((edge, i) => {
            const start = nodePositions.get(edge.source)!;
            const end = nodePositions.get(edge.target)!;

            // Calculate geometry transforms
            const dist = start.distanceTo(end);
            const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

            // Set Position
            tempObject.position.copy(mid);

            // Set Rotation (align Y axis to direction)
            tempObject.lookAt(end);
            tempObject.rotateX(Math.PI / 2); // Cylinder default is Y-aligned, lookAt is Z-aligned

            // Set Scale (X/Z = thickness, Y = length)
            // Thickness = 1 (base geometry) * 0.15 (desired radius)
            // But we can set base geometry radius to 1 and scale it here?
            // Or keep using fixed geometry radius and only scale Y (length).
            // Let's rely on fixed geometry radius (0.15) defined in JSX, so we only scale Y.
            tempObject.scale.set(1, dist, 1);

            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [validEdges, nodePositions, tempObject]);

    // Handle Hover Colors
    useFrame(() => {
        if (!meshRef.current) return;

        // This is a bit costly if we do it every frame for all edges, 
        // but InstancedMesh needs it if we want dynamic coloring.
        // Optimization: only update if hovered state changes? 
        // For now, simple loop is fine unless edges > 100k.

        // Actually, we can just update the color of the hovered instance and reset others?
        // But re-setting all is safer for state consistency.

        const defaultColor = new THREE.Color(edgeColor);
        const activeColor = new THREE.Color('#a855f7'); // Hover color

        // If nothing hovered, we could skip? But we need to reset previous hover.
        // Let's just iterate.

        // Optimization: If performance is issue, we track "previousHovered" and only update 2 instances.
        // For < 5000 edges, full loop is generally barely noticeable on GPU, but CPU overhead exists.
        // We will assume standard graph size < 2000 edges.

        for (let i = 0; i < validEdges.length; i++) {
            // We can allow individual edge styling here if edge.color exists
            const color = (hoveredInstanceId === i) ? activeColor : defaultColor;
            meshRef.current.setColorAt(i, color);
        }

        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    });

    const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const id = e.instanceId;
        if (id !== undefined && validEdges[id]) {
            onEdgeClick?.(validEdges[id]);
        }
    }, [validEdges, onEdgeClick]);

    const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        const id = e.instanceId;
        if (id !== undefined) {
            setHoveredInstanceId(id);
            if (!isVR) document.body.style.cursor = 'pointer';
        }
    }, [isVR]);

    const handlePointerOut = useCallback(() => {
        setHoveredInstanceId(null);
        if (!isVR) document.body.style.cursor = 'auto';
    }, [isVR]);

    if (validEdges.length === 0) return null;

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, validEdges.length]}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
            {/* Cylinder Geometry: RadiusTop, RadiusBottom, Height, RadialSegments */}
            {/* Height=1 means scale.y will control actual length */}
            <cylinderGeometry args={[0.15, 0.15, 1, 8]} />
            <meshStandardMaterial
                transparent
                opacity={edgeOpacity}
                color={edgeColor}
                emissive={edgeColor}
                emissiveIntensity={0.2}
            />
        </instancedMesh>
    );
}
