'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { shareService } from '@/app/services/shareService';
import GraphSceneWeb, { GraphSceneRef } from '@/app/components/3DandXRComponents/Graph/GraphSceneWeb';
import GraphSceneXR from '@/app/components/3DandXRComponents/Graph/GraphSceneXR';
import DetailsPanel from '@/app/components/3DandXRComponents/UI/DetailsPanel';
import OverlayControls from '@/app/components/3DandXRComponents/UI/OverlayControls';
import LayoutSelector from '@/app/components/project/LayoutSelector';
import FilterPanel from '@/app/components/project/FilterPanel';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToastStore } from '@/app/store/useToastStore';
import { ProjectSkeleton } from '@/app/components/ui/ProjectSkeleton';

export default function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string> | null>(null);
    const [isVRMode, setIsVRMode] = useState(false);

    const graphSceneRef = useRef<GraphSceneRef>(null);
    const { addToast } = useToastStore();

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

    const handleLayoutRequest = useCallback(async (algorithm: string) => {
        return shareService.updateLayout(token, algorithm);
    }, [token]);

    const handleLayoutUpdate = useCallback((newGraphData: any) => {
        setProject((prev: any) => ({
            ...prev,
            graph_data: newGraphData,
            updated_at: new Date().toISOString()
        }));
    }, []);

    const handleResetCamera = useCallback(() => {
        if (graphSceneRef.current) {
            graphSceneRef.current.resetCamera();
        }
    }, []);

    if (isLoading) {
        return <ProjectSkeleton />;
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
            <div className="absolute top-4 left-4 z-10 flex items-center gap-4 pointer-events-auto">
                <Link href="/" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                    <h1 className="text-sm font-bold text-white">{project.name}</h1>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Lecture seule</p>
                </div>
            </div>

            {/* Scene 3D Layer */}
            <div className="absolute inset-0 z-0" style={{ touchAction: 'none' }}>
                {isVRMode ? (
                    <GraphSceneXR
                        ref={graphSceneRef}
                        key={`xr-${project.updated_at || 'initial'}`}
                        data={project.graph_data}
                        onSelect={handleSelect}
                        visibleNodeIds={visibleNodeIds}
                    />
                ) : (
                    <GraphSceneWeb
                        ref={graphSceneRef}
                        key={`web-${project.updated_at || 'initial'}`}
                        data={project.graph_data}
                        onSelect={handleSelect}
                        visibleNodeIds={visibleNodeIds}
                    />
                )}
            </div>

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

            {/* VR Instructions Overlay */}
            {isVRMode && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-xl border border-primary-500/30 rounded-2xl p-6 text-center shadow-2xl max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Mode VR Prêt</h3>
                        <p className="text-gray-300 mb-4">
                            La scène est configurée pour la réalité virtuelle.
                            <br />
                            <span className="text-primary-400 font-medium">Cliquez sur l'icône de lunettes en bas à droite</span> pour entrer en immersion.
                        </p>
                        <div className="text-xs text-gray-500">
                            Compatible Meta Quest, HTC Vive, Apple Vision Pro
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
                <OverlayControls
                    onResetCamera={handleResetCamera}
                    onToggleVR={() => setIsVRMode(!isVRMode)}
                >
                    <LayoutSelector
                        onLayoutUpdate={handleLayoutUpdate}
                        onLayoutRequest={handleLayoutRequest}
                    />

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:scale-105 cursor-pointer ${isFilterOpen || visibleNodeIds !== null
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
