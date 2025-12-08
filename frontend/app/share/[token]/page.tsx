'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { shareService } from '@/app/services/shareService';
import GraphScene from '@/app/components/3DandXRComponents/Graph/GraphScene';
import DetailsPanel from '@/app/components/3DandXRComponents/UI/DetailsPanel';
import OverlayControls from '@/app/components/3DandXRComponents/UI/OverlayControls';
import FilterPanel from '@/app/components/project/FilterPanel';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string> | null>(null);

    useEffect(() => {
        const loadProject = async () => {
            try {
                setIsLoading(true);
                const data = await shareService.getSharedProject(token);
                setProject(data);
            } catch (err) {
                console.error(err);
                setError("Ce lien de partage est invalide ou a expiré.");
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            loadProject();
        }
    }, [token]);

    const handleSelect = useCallback((data: any, type: 'node' | 'edge' | null) => {
        setSelectedItem(data);
        setSelectionType(type);
    }, []);

    const handleCloseDetails = useCallback(() => {
        setSelectedItem(null);
        setSelectionType(null);
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
                <div className="relative">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-2xl shadow-2xl">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500"></div>
                                <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full border-4 border-purple-500/20"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-white">Chargement du projet partagé</p>
                                <p className="text-sm text-gray-400 mt-1">Préparation de la visualisation 3D...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Erreur</h1>
                    <p className="mb-6">{error}</p>
                    <Link href="/" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            {/* Header minimaliste pour le mode partagé */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white drop-shadow-md">{project.name}</h1>
                        <p className="text-xs text-gray-400">Mode lecture seule</p>
                    </div>
                </div>
            </div>

            {/* Scene 3D */}
            <GraphScene 
                data={project.graph_data} 
                onSelect={handleSelect}
                visibleNodeIds={visibleNodeIds}
            />

            {/* Details Panel Overlay */}
            {selectedItem && (
                <DetailsPanel
                    data={selectedItem}
                    type={selectionType}
                    onClose={handleCloseDetails}
                />
            )}

            {/* Filter Panel Overlay */}
            {isFilterOpen && project?.graph_data?.nodes && (
                <FilterPanel
                    nodes={project.graph_data.nodes}
                    edges={project.graph_data.edges}
                    onFilterChange={setVisibleNodeIds}
                    onClose={() => setIsFilterOpen(false)}
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
                >
                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:scale-105 cursor-pointer ${
                            isFilterOpen || visibleNodeIds !== null
                                ? 'bg-primary-500/20 text-white border border-primary-500/50'
                                : 'bg-white/5 text-gray-300 hover:bg-primary-500/20 hover:text-white'
                        }`}
                        title="Filtrer le graphe"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span className="hidden sm:inline">Filtres</span>
                        
                        {/* Active Indicator */}
                        {visibleNodeIds !== null && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-black"></span>
                        )}
                    </button>
                </OverlayControls>
            </div>
        </div>
    );
}
