'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { projectsService } from '@/app/services/projectsService';
import { apiClient } from '@/app/lib/apiClient';
import { useJobPolling } from '@/app/hooks/useJobPolling';
import { GraphScene3D, GraphSceneXR } from '@/app/components/R3F';
import type { GraphScene3DRef } from '@/app/components/R3F/GraphScene3D';
// Web UI Components
import { DetailsPanel, OverlayControls } from '@/app/components/R3F/UI';
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
    const [showLabels, setShowLabels] = useState(false);
    const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('auto'); // Track algorithm locally
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    const graphSceneRef = useRef<GraphScene3DRef>(null);
    const { addToast } = useToastStore();

    const router = useRouter();

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

    const handleResetCamera = useCallback(() => {
        if (graphSceneRef.current) {
            graphSceneRef.current.resetCamera();
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

    // Polling logic for async layout updates
    useJobPolling(currentJobId, {
        onSuccess: (result) => {
            const graphData = result.graph_data || result;
            if (graphData && graphData.nodes && graphData.nodes.length > 0) {
                handleLayoutUpdate(graphData);
                addToast('Disposition mise à jour avec succès', 'success');
            } else {
                addToast('Données de layout vides', 'warning');
            }
            setCurrentJobId(null);
            setIsLoading(false);
        },
        onError: (error) => {
            addToast(error || 'Erreur calcul layout', 'error');
            setCurrentJobId(null);
            setIsLoading(false);
        }
    });

    useEffect(() => {
        const loadProject = async () => {
            try {
                setIsLoading(true);
                const data = await projectsService.getById(id);
                setProject(data);
                setCurrentAlgorithm(data.algorithm || 'auto');
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

    const handleLayoutChange = useCallback(async (algorithm: string) => {
        setIsLoading(true);
        setCurrentAlgorithm(algorithm);

        try {
            const response: any = await apiClient.post(`/projects/${id}/layout`, { algorithm });

            if (response && response.job_id) {
                setCurrentJobId(response.job_id);
            } else if (response && response.graph_data) {
                handleLayoutUpdate(response.graph_data);
                setIsLoading(false);
            } else {
                handleLayoutUpdate(response);
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error('Layout update error:', error);
            addToast(error.message, 'error');
            setIsLoading(false);
        }
    }, [id, addToast, handleLayoutUpdate]);

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
            <div className="absolute inset-0 z-0" style={{ touchAction: 'none' }}>
                {project.graph_data ? (
                    isVRMode ? (
                        <>
                            <GraphSceneXR
                                ref={graphSceneRef}
                                key={`xr-${project.updated_at || 'initial'}`}
                                data={project.graph_data}
                                onSelect={handleSelect}
                                visibleNodeIds={visibleNodeIds}
                                projectId={id}
                                onLayoutUpdate={handleLayoutUpdate}
                                onClearFilters={() => setVisibleNodeIds(null)}
                                hasActiveFilters={visibleNodeIds !== null}
                                onLayoutChange={handleLayoutChange}
                            />
                            {/* VR Instruction Overlay - Blocks interaction with preview, sits below VRButton (z-high) */}
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                <div className="bg-surface-950/80 p-6 rounded-2xl border border-primary-500/30 text-center max-w-md shadow-2xl backdrop-blur-md">
                                    <h2 className="text-xl font-bold text-white mb-3">Mode VR Prêt</h2>
                                    <p className="text-gray-300 mb-4 text-sm">
                                        Veuillez mettre votre casque et cliquer sur le bouton <span className="font-bold text-primary-400">ENTER VR</span> situé au bas de l'écran.
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-xs text-blue-300/80">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                        En attente d'activation VR
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <GraphScene3D
                            ref={graphSceneRef}
                            key={`web-${project.updated_at || 'initial'}`}
                            data={project.graph_data}
                            onSelect={handleSelect}
                            visibleNodeIds={visibleNodeIds}
                            showLabels={showLabels}
                            selectedNodeId={selectedItem?.id || null}
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

            {/* Details Panel Overlay - Web Only */}
            {!isVRMode && selectedItem && (
                <DetailsPanel
                    data={selectedItem}
                    type={selectionType}
                    onClose={handleCloseDetails}
                />
            )}

            {/* Filter Panel Overlay - Web Only */}
            {!isVRMode && isFilterOpen && project?.graph_data?.nodes && (
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

            {/* Bottom Controls Overlay - Hidden in VR mode */}
            {!isVRMode && (
                <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
                    <OverlayControls
                        onResetCamera={handleResetCamera}
                        onToggleVR={() => setIsVRMode(!isVRMode)}
                        onShare={() => setIsShareModalOpen(true)}
                        onEdit={() => setIsEditModalOpen(true)}
                        showLabels={showLabels}
                        onToggleLabels={() => setShowLabels(!showLabels)}
                    >
                        <LayoutSelector
                            projectId={id}
                            onLayoutUpdate={handleLayoutUpdate}
                            currentAlgorithm={currentAlgorithm}
                            onAlgorithmChange={setCurrentAlgorithm}
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
            )}
        </div>
    );
}
