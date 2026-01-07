'use client';

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for SSR safety
const XRCanvas = dynamic(() => import('./XR/XRCanvas'), { ssr: false });
const GraphNodes = dynamic(() => import('./GraphNodes'), { ssr: false });
const GraphEdges = dynamic(() => import('./GraphEdges'), { ssr: false });
const XRLocomotion = dynamic(() => import('./XR/XRLocomotion'), { ssr: false });
const XRDetailsPanel = dynamic(() => import('./XR/XRDetailsPanel'), { ssr: false });
const XRControlPanel = dynamic(() => import('./XR/XRControlPanel'), { ssr: false });

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

interface GraphSceneXRProps {
    data: GraphData;
    onSelect?: (data: any, type: 'node' | 'edge' | null) => void;
    visibleNodeIds?: Set<string> | null;
    projectId?: string;
    onLayoutUpdate?: (newData: any) => void;
    onLayoutChange?: (algorithm: string) => void;
    onClearFilters?: () => void;
    hasActiveFilters?: boolean;
    className?: string;
}

export interface GraphSceneXRRef {
    resetCamera: () => void;
}

/**
 * XR-enabled Graph Scene component for VR visualization.
 * Uses React Three Fiber with @react-three/xr.
 */
const GraphSceneXR = forwardRef<GraphSceneXRRef, GraphSceneXRProps>(({
    data,
    onSelect,
    visibleNodeIds,
    projectId,
    onLayoutUpdate,
    onClearFilters,
    hasActiveFilters,
    className
}, ref) => {
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null);
    const [showLabels, setShowLabels] = useState(true);

    useImperativeHandle(ref, () => ({
        resetCamera: () => {
            console.log('Reset XR camera');
            // TODO: Reset XR origin position
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
        setSelectedNode(prev => prev?.id === node.id ? null : node);
        setSelectedEdge(null);
        onSelect?.(node, 'node');
    }, [onSelect]);

    const handleEdgeClick = useCallback((edge: EdgeData) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
        onSelect?.(edge, 'edge');
    }, [onSelect]);

    const handleClosePanel = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
        onSelect?.(null, null);
    }, [onSelect]);

    return (
        <div className={className || "h-full w-full overflow-hidden rounded-xl bg-black/20 relative"}>
            <XRCanvas>
                {/* Locomotion: Increased speed for better movement perception */}
                <XRLocomotion speed={0.2} rotationSpeed={0.05} />

                {/* Graph Content - Positioned 4m away, scaled down to fit view */}
                <group position={[0, 1.3, -4]} scale={0.02}>
                    <GraphNodes
                        nodes={visibleNodes}
                        onNodeClick={handleNodeClick}
                        selectedNodeId={selectedNode?.id}
                        showLabels={showLabels}
                        isVR={true}
                    />
                    {/* GraphEdges restored after Three.js downgrade */}
                    <GraphEdges
                        edges={visibleEdges}
                        nodes={visibleNodes}
                        onEdgeClick={handleEdgeClick}
                        isVR={true}
                    />
                </group>

                {/* Details Panel */}
                {selectedNode && (
                    <XRDetailsPanel
                        data={selectedNode}
                        type="node"
                        onClose={handleClosePanel}
                    />
                )}
                {selectedEdge && (
                    <XRDetailsPanel
                        data={selectedEdge}
                        type="edge"
                        onClose={handleClosePanel}
                    />
                )}

                {/* Control Panel - Floating dashboard */}
                <XRControlPanel
                    showLabels={showLabels}
                    onToggleLabels={() => setShowLabels(!showLabels)}
                    onResetCamera={() => {
                        console.log('Resetting Camera via Control Panel');
                    }}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={onClearFilters}
                    position={[0, 1.2, -0.5]}
                    rotation={[-0.3, 0, 0]}
                />
            </XRCanvas>
        </div>
    );
});

GraphSceneXR.displayName = 'GraphSceneXR';

export default GraphSceneXR;
