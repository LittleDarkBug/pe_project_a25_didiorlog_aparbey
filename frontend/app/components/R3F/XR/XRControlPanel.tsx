
import { useState } from 'react';
import { Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';

interface XRControlPanelProps {
    onResetCamera?: () => void;
    showLabels?: boolean;
    onToggleLabels?: () => void;
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
    onLayoutChange?: (algorithm: string) => void;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

function XRButton({ label, onClick, active, position, width = 0.8, height = 0.2, color = '#3b82f6', disabled = false }: any) {
    const [hovered, setHovered] = useState(false);
    const finalColor = disabled ? '#4b5563' : (active ? '#a855f7' : (hovered ? '#60a5fa' : color));

    return (
        <group position={position}
            onPointerOver={() => !disabled && setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                if (!disabled) onClick();
            }}
        >
            <mesh>
                <boxGeometry args={[width, height, 0.05]} />
                <meshStandardMaterial color={finalColor} transparent opacity={disabled ? 0.5 : 1} />
            </mesh>
            <Text
                position={[0, 0, 0.03]}
                fontSize={0.08}
                color={disabled ? '#9ca3af' : 'white'}
                anchorX="center"
                anchorY="middle"
            >
                {label}
            </Text>
        </group>
    );
}

export default function XRControlPanel({
    onResetCamera,
    showLabels,
    onToggleLabels,
    hasActiveFilters,
    onClearFilters,
    onLayoutChange,
    position = [0, 1, 0.5],
    rotation = [-0.5, 0, 0]
}: XRControlPanelProps) {
    const [showLayouts, setShowLayouts] = useState(false);

    const ALGORITHMS = [
        { id: 'fruchterman_reingold', label: 'Fruchterman' },
        { id: 'force_atlas', label: 'Force Atlas' },
        { id: 'sphere', label: 'Sphère' },
        { id: 'grid', label: 'Grille' }
    ];

    if (showLayouts) {
        return (
            <group position={position} rotation={rotation}>
                <mesh>
                    <planeGeometry args={[1.5, 1.5]} />
                    <meshStandardMaterial color="#1e293b" transparent opacity={0.9} />
                </mesh>
                <Text position={[0, 0.6, 0.01]} fontSize={0.1} color="white" anchorX="center">
                    Choisir Layout
                </Text>
                {ALGORITHMS.map((algo, i) => (
                    <XRButton
                        key={algo.id}
                        label={algo.label}
                        position={[0, 0.3 - (i * 0.25), 0.02]}
                        onClick={() => {
                            onLayoutChange?.(algo.id);
                            setShowLayouts(false);
                        }}
                    />
                ))}
                <XRButton
                    label="Retour"
                    color="#64748b"
                    position={[0, -0.6, 0.02]}
                    onClick={() => setShowLayouts(false)}
                />
            </group>
        )
    }

    return (
        <group position={position} rotation={rotation}>
            {/* Panel Background */}
            <mesh>
                <planeGeometry args={[1.5, 1.4]} />
                <meshStandardMaterial color="#1e293b" transparent opacity={0.8} />
            </mesh>

            {/* Title */}
            <Text
                position={[0, 0.6, 0.01]}
                fontSize={0.1}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                Contrôles VR
            </Text>

            {/* Buttons Row 1 */}
            <XRButton
                label="Réinitialiser Vue"
                position={[0, 0.35, 0.02]}
                onClick={onResetCamera}
            />

            {/* Buttons Row 2 */}
            <XRButton
                label={showLabels ? "Masquer Labels" : "Afficher Labels"}
                active={showLabels}
                position={[0, 0.1, 0.02]}
                onClick={onToggleLabels}
            />

            {/* Buttons Row 3 - Layouts */}
            <XRButton
                label="Changer Layout"
                color="#eab308"
                position={[0, -0.15, 0.02]}
                onClick={() => setShowLayouts(true)}
            />

            {/* Buttons Row 4 - Filters */}
            {hasActiveFilters && (
                <XRButton
                    label="Effacer Filtres"
                    color="#ef4444"
                    position={[0, -0.4, 0.02]}
                    onClick={onClearFilters}
                />
            )}
        </group>
    );
}
