'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { projectsService } from '@/app/services/projectsService';
import GraphScene from '@/app/components/3DandXRComponents/Graph/GraphScene';
import DetailsPanel from '@/app/components/3DandXRComponents/UI/DetailsPanel';
import OverlayControls from '@/app/components/3DandXRComponents/UI/OverlayControls';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);
    const [clickPosition, setClickPosition] = useState<{ x?: number; y?: number }>({});

    const router = useRouter();

    useEffect(() => {
        const loadProject = async () => {
            try {
                setIsLoading(true);
                const data = await projectsService.getById(id);
                setProject(data);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger le projet");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            loadProject();
        }
    }, [id]);

    const handleSelect = (data: any, type: 'node' | 'edge' | null, x?: number, y?: number) => {
        setSelectedItem(data);
        setSelectionType(type);
        setClickPosition({ x, y });
    };

    const handleCloseDetails = () => {
        setSelectedItem(null);
        setSelectionType(null);
        setClickPosition({});
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
                <div className="relative">
                    {/* Glassmorphism container */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-2xl shadow-2xl">
                        <div className="flex flex-col items-center gap-6">
                            {/* Animated spinner */}
                            <div className="relative">
                                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500"></div>
                                <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full border-4 border-purple-500/20"></div>
                            </div>

                            {/* Loading text */}
                            <div className="text-center">
                                <p className="text-lg font-medium text-white">Chargement du projet</p>
                                <p className="text-sm text-gray-400 mt-1">Préparation de la visualisation 3D...</p>
                            </div>
                        </div>
                    </div>

                    {/* Ambient glow effect */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl"></div>
                        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-purple-500/20 blur-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
                <p className="text-red-400">{error || "Projet introuvable"}</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                >
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            {/* 3D Scene Layer */}
            <div className="absolute inset-0 z-0" style={{ touchAction: 'none' }}>
                {project.graph_data ? (
                    <GraphScene
                        data={project.graph_data}
                        onSelect={handleSelect}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        Aucune donnée de graphe
                    </div>
                )}
            </div>

            {/* Floating Back Button - Top Left */}
            <button
                onClick={() => router.push('/dashboard')}
                className="fixed left-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white backdrop-blur-xl transition-all hover:bg-black/70 hover:scale-110 border border-white/10 cursor-pointer"
                title="Retour au tableau de bord"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>

            {/* Floating Project Info - Top Right */}
            <div className="fixed right-4 top-4 z-20 rounded-xl bg-black/30 px-4 py-2 backdrop-blur-xl border border-white/10">
                <p className="text-sm font-medium text-white">{project.name}</p>
                <p className="text-xs text-gray-400">
                    {project.metadata?.node_count || 0}N • {project.metadata?.edge_count || 0}L
                </p>
            </div>

            {/* Details Panel Overlay */}
            {selectedItem && (
                <DetailsPanel
                    data={selectedItem}
                    type={selectionType}
                    onClose={handleCloseDetails}
                    mouseX={clickPosition.x}
                    mouseY={clickPosition.y}
                />
            )}

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
                <OverlayControls
                    onResetCamera={() => {
                        console.log("Reset Camera");
                    }}
                    onToggleVR={() => {
                        alert("Pour entrer en VR, veuillez utiliser le bouton lunettes en bas à droite (si disponible).");
                    }}
                    onShare={() => {
                        alert("Lien de partage copié ! (Simulation)");
                    }}
                />
            </div>
        </div>
    );
}
