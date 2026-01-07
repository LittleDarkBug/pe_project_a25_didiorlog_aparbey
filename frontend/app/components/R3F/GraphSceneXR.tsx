import { useState, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useXRInputSourceState } from '@react-three/xr';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

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
// Internal component to handle menu toggling via controller buttons
function MenuController({ onToggle }: { onToggle: (pose?: { position: [number, number, number], rotation: [number, number, number] }) => void }) {
    const leftState = useXRInputSourceState('controller', 'left');
    const rightState = useXRInputSourceState('controller', 'right');
    const { camera } = useThree(); // Access XR camera
    const lastToggleTime = useRef(0);

    useFrame(() => {
        const now = Date.now();
        if (now - lastToggleTime.current < 500) return; // Debounce 500ms

        let toggled = false;

        // Check Right Controller 'A' button (usually button 4 or 0 depending on profile, often 'a-button')
        // Standard gamepad mapping: 0=Trigger, 1=Squeeze, 4=A, 5=B
        if (rightState && rightState.gamepad && rightState.gamepad.buttons) {
            const gamepad = rightState.gamepad as any;
            const buttons = gamepad.buttons;
            // Try button 4 (A) or 5 (B) or checking standard mapping
            if (buttons[4]?.pressed || buttons[5]?.pressed) {
                toggled = true;
            }
        }

        // Check Left Controller 'X' button
        if (!toggled && leftState && leftState.gamepad && leftState.gamepad.buttons) {
            const gamepad = leftState.gamepad as any;
            const buttons = gamepad.buttons;
            if (buttons[4]?.pressed || buttons[5]?.pressed) {
                toggled = true;
            }
        }

        if (toggled) {
            // Calculate spawn position in front of user
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(camera.quaternion);
            forward.y = 0; // Keep level? Or follow gaze? Let's keep it slightly level but following gaze y
            forward.normalize();

            const offset = forward.clone().multiplyScalar(0.8); // 0.8m in front
            const pos = camera.position.clone().add(offset);

            // Rotation: face the user (billboard-ish but locked on spawn)
            // Ideally same rotation as camera but flat on Y
            const rot = camera.rotation.clone();
            // Simplify: Just pass position, text billboard handles local rotation usually, 
            // but XRControlPanel is a plane. We need it to face camera.
            // Using camera rotation is good start.

            onToggle({
                position: [pos.x, pos.y, pos.z],
                rotation: [rot.x, rot.y, rot.z]
            });
            lastToggleTime.current = now;
        }
    });

    return null;
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
    const [showControlPanel, setShowControlPanel] = useState(false);
    const [panelPose, setPanelPose] = useState<{ position: [number, number, number], rotation: [number, number, number] }>({
        position: [0, 1.2, -0.5],
        rotation: [-0.3, 0, 0]
    });

    useImperativeHandle(ref, () => ({
        resetCamera: () => {
            console.log('Reset XR camera');
            // TODO: Reset XR origin position
        }
    }));

    // ... existing filter logic ...

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

    const handleMenuToggle = useCallback((pose?: { position: [number, number, number], rotation: [number, number, number] }) => {
        setShowControlPanel(prev => !prev);
        if (pose) {
            setPanelPose(pose);
        }
    }, []);

    return (
        <div className={className || "h-full w-full overflow-hidden rounded-xl bg-black/20 relative"}>
            <XRCanvas>
                <MenuController onToggle={handleMenuToggle} />

                {/* Locomotion: Increased speed for better movement perception */}
                <XRLocomotion speed={0.2} rotationSpeed={0.05} />

                {/* ... graph content ... */}
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

                {/* Control Panel - toggleable via 'A' / 'X' */}
                {showControlPanel && (
                    <XRControlPanel
                        showLabels={showLabels}
                        onToggleLabels={() => setShowLabels(!showLabels)}
                        onResetCamera={() => {
                            console.log('Resetting Camera via Control Panel');
                        }}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={onClearFilters}
                        position={panelPose.position}
                        rotation={panelPose.rotation}
                    />
                )}
            </XRCanvas>
        </div>
    );
});

GraphSceneXR.displayName = 'GraphSceneXR';

export default GraphSceneXR;
