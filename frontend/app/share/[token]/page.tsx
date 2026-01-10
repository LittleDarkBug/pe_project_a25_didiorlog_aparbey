'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { projectsService } from '@/app/services/projectsService';
import GraphSceneWeb from '@/app/components/3DandXRComponents/Graph/GraphSceneWeb';
import GraphSceneXR from '@/app/components/3DandXRComponents/Graph/GraphSceneXR';
import { GraphSceneRef } from '@/app/components/3DandXRComponents/Graph/GraphSceneWeb';
import DetailsPanel from '@/app/components/3DandXRComponents/UI/DetailsPanel';
import OverlayControls from '@/app/components/3DandXRComponents/UI/OverlayControls';
import LayoutSelector from '@/app/components/project/LayoutSelector';
import FilterPanel from '@/app/components/project/FilterPanel';
import { ProjectSkeleton } from '@/app/components/ui/ProjectSkeleton';

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string> | null>(null);
    const [visibleEdgeIds, setVisibleEdgeIds] = useState<Set<string> | null>(null);
    const [isVRMode, setIsVRMode] = useState(false);
    const [isInXR, setIsInXR] = useState(false);
    const [showLabels, setShowLabels] = useState(false);
    const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('auto');

    const graphSceneRef = useRef<GraphSceneRef>(null);

    const handleResetCamera = useCallback(() => {
        if (graphSceneRef.current) {
            graphSceneRef.current.resetCamera();
        }
    }, []);

    useEffect(() => {
        const loadSharedProject = async () => {
            try {
                setIsLoading(true);
                // Call API directly for share token
                const data = await projectsService.getByToken(token);
                setProject(data);
                setCurrentAlgorithm(data.algorithm || 'auto');
            } catch (err) {
                console.error(err);
                setError("Projet inaccessible ou lien expiré");
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            loadSharedProject();
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

    const handleXRStateChange = useCallback((inXR: boolean) => {
        setIsInXR(inXR);
    }, []);

    const handleResetFilters = useCallback(() => {
        setVisibleNodeIds(null);
        setVisibleEdgeIds(null);
        setIsFilterOpen(false);
    }, []);

    const handleFilterChange = useCallback((filters: { nodes: Set<string> | null, edges: Set<string> | null }) => {
        setVisibleNodeIds(filters.nodes);
        setVisibleEdgeIds(filters.edges);
    }, []);

    const handleLayoutUpdate = useCallback((newGraphData: any) => {
        if (!newGraphData || !newGraphData.nodes || newGraphData.nodes.length === 0) {
            console.warn("Mise à jour du layout ignorée car les données sont invalides", newGraphData);
            return;
        }
        setProject((prev: any) => ({
            ...prev,
            graph_data: newGraphData
        }));
    }, []);

    const handleLayoutRequest = useCallback(async (algorithm: string) => {
        return projectsService.updateSharedLayout(token, algorithm);
    }, [token]);

    if (isLoading) return <ProjectSkeleton />;

    if (error || !project) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
                <p className="text-red-400">{error || "Projet introuvable"}</p>
            </div>
        );
    }
    // ... (rest of render) ...
    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            {/* VR Session Active Screen */}
            {isInXR && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950">
                    <div className="text-center animate-pulse">
                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Session VR Partagée Active</h2>
                        <p className="text-gray-400 max-w-sm mb-6">
                            Regardez dans votre casque VR pour explorer le graphe.
                            <br />
                            <span className="text-sm text-gray-500">Retirez le casque pour revenir ici.</span>
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30"
                        >
                            Arrêter la session VR
                        </button>
                    </div>
                </div>
            )}

            {/* VR Instructions Overlay */}
            {isVRMode && !isInXR && (
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
                            Compatible Meta Quest, HTC Vive
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 z-0">
                {project.graph_data ? (
                    isVRMode ? (
                        <GraphSceneXR
                            ref={graphSceneRef}
                            data={project.graph_data}
                            onSelect={handleSelect}
                            visibleNodeIds={visibleNodeIds}
                            visibleEdgeIds={visibleEdgeIds}
                            onXRStateChange={handleXRStateChange}
                            showLabels={showLabels}
                            onResetFilters={handleResetFilters}
                            onToggleLabels={() => setShowLabels(prev => !prev)}
                            projectId={project.id} // Enable Layout calculation if authorized
                            onLayoutUpdate={handleLayoutUpdate}
                        />
                    ) : (
                        <GraphSceneWeb
                            ref={graphSceneRef}
                            key={`web-${project.updated_at || 'initial'}`}
                            data={project.graph_data}
                            onSelect={handleSelect}
                            visibleNodeIds={visibleNodeIds}
                            visibleEdgeIds={visibleEdgeIds}
                            showLabels={showLabels}
                        />
                    )
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        Aucune donnée
                    </div>
                )}
            </div>

            {/* Overlays (Hidden in XR) */}
            {!isInXR && (
                <>
                    <div className="fixed right-4 top-4 z-20">
                        <div className="rounded-xl bg-black/30 px-4 py-2 backdrop-blur-xl border border-white/10">
                            <p className="text-sm font-medium text-white">{project.name}</p>
                        </div>
                    </div>

                    {/* Filter Panel Overlay */}
                    {isFilterOpen && project?.graph_data?.nodes && (
                        <FilterPanel
                            nodes={project.graph_data.nodes}
                            edges={project.graph_data.edges}
                            onFilterChange={handleFilterChange}
                            onClose={() => setIsFilterOpen(false)}
                        />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
                        <OverlayControls
                            onResetCamera={handleResetCamera}
                            onToggleVR={() => setIsVRMode(!isVRMode)}
                            hideEdit={true} // Read only
                            hideShare={true}
                        >
                            <LayoutSelector
                                projectId={undefined} // No projectId for shared view logic defaults
                                onLayoutUpdate={handleLayoutUpdate}
                                onLayoutRequest={handleLayoutRequest}
                                currentAlgorithm={currentAlgorithm}
                                onAlgorithmChange={setCurrentAlgorithm}
                            />

                            {/* Labels Toggle */}
                            <button
                                onClick={() => setShowLabels(!showLabels)}
                                className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:scale-105 cursor-pointer ${showLabels
                                    ? 'bg-primary-500/20 text-white border border-primary-500/50'
                                    : 'bg-white/5 text-gray-300 hover:bg-primary-500/20 hover:text-white'
                                    }`}
                                title={showLabels ? "Masquer les labels" : "Afficher les labels"}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="hidden sm:inline">Labels</span>
                            </button>

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
                </>
            )}

            {selectedItem && (
                <DetailsPanel
                    data={selectedItem}
                    type={selectionType}
                    onClose={handleCloseDetails}
                    height="50%" // Smaller panel for share view?
                />
            )}
        </div>
    );
}
