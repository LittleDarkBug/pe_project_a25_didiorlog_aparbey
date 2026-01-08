'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { projectsService } from '@/app/services/projectsService';
import GraphSceneWeb from '@/app/components/3DandXRComponents/Graph/GraphSceneWeb';
import GraphSceneXR from '@/app/components/3DandXRComponents/Graph/GraphSceneXR';
import { GraphSceneRef } from '@/app/components/3DandXRComponents/Graph/GraphSceneWeb';
import DetailsPanel from '@/app/components/3DandXRComponents/UI/DetailsPanel';
import OverlayControls from '@/app/components/3DandXRComponents/UI/OverlayControls';
import EditProjectModal from '@/app/components/dashboard/EditProjectModal';
import LayoutSelector from '@/app/components/project/LayoutSelector';
import FilterPanel from '@/app/components/project/FilterPanel';
import ShareModal from '@/app/components/project/ShareModal';
import { useToastStore } from '@/app/store/useToastStore';
import { ProjectSkeleton } from '@/app/components/ui/ProjectSkeleton';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string> | null>(null);
    const [isVRMode, setIsVRMode] = useState(false);
    const [isInXR, setIsInXR] = useState(false); // Track actual XR session state
    const [showLabels, setShowLabels] = useState(false); // Toggle labels
    const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('auto'); // Track algorithm locally

    const graphSceneRef = useRef<GraphSceneRef>(null);
    const { addToast } = useToastStore();

    const router = useRouter();

    const handleResetCamera = useCallback(() => {
        if (graphSceneRef.current) {
            graphSceneRef.current.resetCamera();
        }
    }, []);

    useEffect(() => {
        const loadProject = async () => {
            try {
                setIsLoading(true);
                const data = await projectsService.getById(id);
                setProject(data);
                setCurrentAlgorithm(data.algorithm || 'auto'); // Initialize with project's algorithm
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

    const handleSelect = useCallback((data: any, type: 'node' | 'edge' | null) => {
        setSelectedItem(data);
        setSelectionType(type);
    }, []);

    const handleCloseDetails = useCallback(() => {
        setSelectedItem(null);
        setSelectionType(null);
    }, []);

    const handleEditSuccess = useCallback((updatedProject: any) => {
        setIsEditModalOpen(false);
        if (updatedProject) {
            setProject(updatedProject);
        }
    }, []);

    const handleLayoutUpdate = useCallback((newGraphData: any) => {
        if (!newGraphData || !newGraphData.nodes || newGraphData.nodes.length === 0) {
            console.warn("Mise à jour du layout ignorée car les données sont invalides", newGraphData);
            return;
        }
        setProject((prev: any) => ({
            ...prev,
            graph_data: newGraphData,
            updated_at: new Date().toISOString()
        }));
    }, []);

    // Handle XR state changes from GraphSceneXR
    const handleXRStateChange = useCallback((inXR: boolean) => {
        setIsInXR(inXR);
    }, []);

    const handleResetFilters = useCallback(() => {
        setVisibleNodeIds(null);
        setIsFilterOpen(false);
    }, []);

    if (isLoading) {
        return <ProjectSkeleton />;
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
            {/* VR Session Active Screen - Shown when user is in headset */}
            {isInXR && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950">
                    <div className="text-center animate-pulse">
                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Session VR Active</h2>
                        <p className="text-gray-400 max-w-sm mb-6">
                            Regardez dans votre casque VR pour explorer le graphe.
                            <br />
                            <span className="text-sm text-gray-500">Retirez le casque pour revenir ici.</span>
                        </p>
                        <button
                            onClick={() => window.location.reload()} // Forcing reload to kill session cleanly if needed, or we could try accessing XR helper to exit
                            className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30"
                        >
                            Arrêter la session VR
                        </button>
                    </div>
                </div>
            )}

            {/* 3D Scene Layer */}
            <div className="absolute inset-0 z-0" style={{ touchAction: 'none' }}>
                {project.graph_data ? (
                    isVRMode ? (
                        <GraphSceneXR
                            ref={graphSceneRef}
                            key={`xr-${project.updated_at || 'initial'}`}
                            data={project.graph_data}
                            onSelect={handleSelect}
                            visibleNodeIds={visibleNodeIds}
                            projectId={id}
                            onLayoutUpdate={handleLayoutUpdate}
                            onXRStateChange={handleXRStateChange}
                            showLabels={showLabels}
                            onResetFilters={handleResetFilters}
                            onToggleLabels={() => setShowLabels(prev => !prev)}
                        />
                    ) : (
                        <GraphSceneWeb
                            ref={graphSceneRef}
                            key={`web-${project.updated_at || 'initial'}`}
                            data={project.graph_data}
                            onSelect={handleSelect}
                            visibleNodeIds={visibleNodeIds}
                            showLabels={showLabels}
                        />
                    )
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

            {/* Top Right Controls */}
            <div className="fixed right-4 top-4 z-20 flex flex-col gap-2 items-end">
                <div className="rounded-xl bg-black/30 px-4 py-2 backdrop-blur-xl border border-white/10">
                    <p className="text-sm font-medium text-white">{project.name}</p>
                    <p className="text-xs text-gray-400">
                        {project.metadata?.node_count || 0}N • {project.metadata?.edge_count || 0}L
                    </p>
                </div>
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

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-4xl rounded-2xl bg-surface-900 p-6 border border-surface-50/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Éditer la visualisation</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-sm text-gray-400 mb-6">
                            Modifiez les données ou le mapping de votre projet existant.
                        </div>
                        <EditProjectModal
                            project={project}
                            onClose={() => setIsEditModalOpen(false)}
                            onSuccess={handleEditSuccess}
                        />
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {isShareModalOpen && project && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    projectId={project.id}
                    projectName={project.name}
                />
            )}

            {/* VR Instructions Overlay - Hidden when actually in XR headset */}
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

            {/* Bottom Controls Overlay - Hidden in XR */}
            {!isInXR && (
                <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
                    <OverlayControls
                        onResetCamera={handleResetCamera}
                        onToggleVR={() => setIsVRMode(!isVRMode)}
                        onShare={() => setIsShareModalOpen(true)}
                        onEdit={() => setIsEditModalOpen(true)}
                    >
                        <LayoutSelector
                            projectId={id}
                            onLayoutUpdate={handleLayoutUpdate}
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
            )}
        </div>
    );
}
