'use client';

import { Html } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

interface PanelData {
    id?: string;
    [key: string]: any;
}

interface XRDetailsPanelProps {
    data: PanelData | null;
    type: 'node' | 'edge';
    position?: [number, number, number];
    onClose?: () => void;
}

/**
 * XR Details Panel using drei's Html component.
 * Displays node/edge information in VR as a floating HTML panel.
 */
export default function XRDetailsPanel({
    data,
    type,
    position = [0, 1.6, -1.5],
    onClose
}: XRDetailsPanelProps) {
    const groupRef = useRef<THREE.Group>(null);

    if (!data) return null;

    // Filter out technical properties
    const displayEntries = Object.entries(data).filter(
        ([key]) => !['x', 'y', 'z', 'fx', 'fy', 'fz', '__index', 'geometryId', 'vx', 'vy', 'vz'].includes(key)
    );

    return (
        <group ref={groupRef} position={position}>
            <Html
                transform
                occlude
                distanceFactor={1.5}
                style={{
                    width: '400px',
                    pointerEvents: 'auto'
                }}
            >
                <div className="bg-slate-900/95 border-2 border-cyan-400 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
                        <h2 className="text-xl font-bold text-white font-mono">
                            {type === 'node' ? '📍 NODE' : '🔗 EDGE'}: {data.id || 'Unknown'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 text-white font-bold transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Data Rows */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {displayEntries.map(([key, value]) => (
                            <div
                                key={key}
                                className="flex justify-between items-center py-2 px-3 bg-slate-800/50 rounded-lg"
                            >
                                <span className="text-slate-400 font-medium uppercase text-sm">
                                    {key}:
                                </span>
                                <span className="text-white font-bold text-sm max-w-[200px] truncate">
                                    {String(value)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-700 text-center">
                        <span className="text-slate-500 text-xs">
                            Cliquez sur le ✕ ou ailleurs pour fermer
                        </span>
                    </div>
                </div>
            </Html>
        </group>
    );
}
