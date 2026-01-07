'use client';

import { useCallback, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Three.js
const GraphCanvas = dynamic(() => import('./GraphCanvas'), { ssr: false });
const GraphNodes = dynamic(() => import('./GraphNodes'), { ssr: false });
const GraphEdges = dynamic(() => import('./GraphEdges'), { ssr: false });

interface NodeData {
    id: string;
    x: number;
    y: number;
    z: number;
    label?: string;
    color?: string;
    [key: string]: any;
}

interface EdgeData {
    source: string;
    target: string;
    weight?: number;
    [key: string]: any;
}

interface GraphData {
    nodes: NodeData[];
    edges: EdgeData[];
}

interface GraphScene3DProps {
    data: GraphData;
    onSelect?: (data: any, type: 'node' | 'edge' | null) => void;
    visibleNodeIds?: Set<string> | null;
    className?: string;
    showLabels?: boolean;
    selectedNodeId?: string | null; // Controlled from parent
}

export interface GraphScene3DRef {
    resetCamera: () => void;
    clearSelection: () => void;
}

/**
 * Main 3D Graph Scene component (Web version).
 * Uses React Three Fiber for rendering.
 */
const GraphScene3D = forwardRef<GraphScene3DRef, GraphScene3DProps>(({
    data,
    onSelect,
    visibleNodeIds,
    className,
    showLabels = false,
    selectedNodeId = null
}, ref) => {

    useImperativeHandle(ref, () => ({
        resetCamera: () => {
            console.log('Reset camera');
        },
        clearSelection: () => {
            onSelect?.(null, null);
        }
    }));

    // Filter visible nodes
    const visibleNodes = visibleNodeIds
        ? data.nodes.filter(n => visibleNodeIds.has(n.id))
        : data.nodes;

    // Filter edges to only show connections between visible nodes
    const visibleEdges = visibleNodeIds
        ? data.edges.filter(e =>
            visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
        )
        : data.edges;

    const handleNodeClick = useCallback((node: NodeData) => {
        // Toggle selection: if already selected, deselect; otherwise select
        if (selectedNodeId === node.id) {
            onSelect?.(null, null);
        } else {
            onSelect?.(node, 'node');
        }
    }, [onSelect, selectedNodeId]);

    const handleEdgeClick = useCallback((edge: EdgeData) => {
        onSelect?.(edge, 'edge');
    }, [onSelect]);

    // Click on empty space to deselect
    const handleCanvasClick = useCallback(() => {
        // This will be triggered by clicks that don't hit nodes/edges
        // We don't deselect here as it would interfere with node clicks
    }, []);

    return (
        <GraphCanvas className={className}>
            <GraphNodes
                nodes={visibleNodes}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNodeId}
                showLabels={showLabels}
            />
            <GraphEdges
                edges={visibleEdges}
                nodes={visibleNodes}
                onEdgeClick={handleEdgeClick}
            />
        </GraphCanvas>
    );
});

GraphScene3D.displayName = 'GraphScene3D';

export default GraphScene3D;
