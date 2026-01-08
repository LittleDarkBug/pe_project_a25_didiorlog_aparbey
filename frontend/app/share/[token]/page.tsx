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

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectionType, setSelectionType] = useState<'node' | 'edge' | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string> | null>(null);
    const [isVRMode, setIsVRMode] = useState(false);
    const [isInXR, setIsInXR] = useState(false);
    const [showLabels, setShowLabels] = useState(false); // Toggle labels
    const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('auto');

    const graphSceneRef = useRef<GraphSceneRef>(null);

    const router = useRouter();

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
        setIsFilterOpen(false);
    }, []);

    if (isLoading) return <ProjectSkeleton />;

    if (error || !project) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
                <p className="text-red-400">{error || "Projet introuvable"}</p>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            {/* VR Session Active Screen */}
            {isInXR && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950">
                    <div className="text-center animate-pulse">
                        <h2 className="text-2xl font-bold text-white mb-2">Session VR Partagée Active</h2>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30"
                        >
                            Arrêter la session VR
                        </button>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 z-0">
                {project.graph_data ? (
                    isVRMode ? (
                        <GraphSceneXR
                            ref={graphSceneRef}
                            key={`xr-${project.updated_at || 'initial'}`}
                            data={project.graph_data}
                            onSelect={handleSelect}
                            visibleNodeIds={visibleNodeIds}
                            onXRStateChange={handleXRStateChange}
                            showLabels={showLabels}
                            onResetFilters={handleResetFilters}
                            onToggleLabels={() => setShowLabels(prev => !prev)}
                        // Share page might not have projectId for layout updates? 
                        // Or backend supports it via token? usually read-only unless authorized.
                        // Pass nothing for layout Update if read-only? 
                        // Assuming read-only for share view unless stated otherwise.
                        // But GraphSceneXR requires projectId for layout requests.
                        // If user wants to change layout in VR share view?
                        // Let's assume view-only for layout persistence, but local layout computation OK?
                        // GraphSceneXR uses API to compute layout.
                        // Pass undefined for projectId/onLayoutUpdate if strictly read-only.
                        // However, we want parity.
                        // If project is loaded via token, backend might restrict updates.
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

                    <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
                        <OverlayControls
                            onResetCamera={handleResetCamera}
                            onToggleVR={() => setIsVRMode(!isVRMode)}
                            hideEdit={true} // Read only
                            hideShare={true}
                        >
                            {/* Layout Selector might fail without auth token if API protected */}
                            {/* But labels toggle works locally */}
                            <button
                                onClick={() => setShowLabels(!showLabels)}
                                className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:scale-105 cursor-pointer ${showLabels
                                    ? 'bg-primary-500/20 text-white border border-primary-500/50'
                                    : 'bg-white/5 text-gray-300 hover:bg-primary-500/20 hover:text-white'
                                    }`}
                            >
                                <span className="hidden sm:inline">Labels</span>
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
