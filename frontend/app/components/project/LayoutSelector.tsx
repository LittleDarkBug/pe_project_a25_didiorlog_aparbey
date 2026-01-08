'use client';

import { useState } from 'react';
import { apiClient } from '@/app/lib/apiClient';
import { useToastStore } from '@/app/store/useToastStore';
import { useJobPolling } from '@/app/hooks/useJobPolling';

interface LayoutSelectorProps {
    projectId?: string;
    onLayoutUpdate: (newGraphData: any) => void;
    onLayoutRequest?: (algorithm: string) => Promise<any>;
    currentAlgorithm?: string;
    onAlgorithmChange?: (algorithm: string) => void;
}

const ALGORITHMS = [
    { id: 'fruchterman_reingold', label: 'Fruchterman-Reingold', description: 'Répartition équilibrée des nœuds pour une visualisation claire' },
    { id: 'kamada_kawai', label: 'Kamada-Kawai', description: 'Préserve les distances du graphe pour révéler sa topologie naturelle' },
    { id: 'drl', label: 'DrL', description: 'Optimisé pour les grands graphes, fait ressortir les communautés' },
    { id: 'force_atlas', label: 'Force Atlas', description: 'Les nœuds connectés se rapprochent, idéal pour détecter les clusters' },
    { id: 'sphere', label: 'Sphérique', description: 'Distribution uniforme sur une sphère pour navigation immersive' },
    { id: 'grid', label: 'Grille', description: 'Organisation géométrique fixe pour comparer des structures' },
    { id: 'random', label: 'Aléatoire', description: 'Position aléatoire des nœuds, utile pour comparaison' },
];

export default function LayoutSelector({ projectId, onLayoutUpdate, onLayoutRequest, currentAlgorithm, onAlgorithmChange }: LayoutSelectorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToastStore();
    const [isOpen, setIsOpen] = useState(false);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    // Trouver le label du layout actuel
    const currentLayout = ALGORITHMS.find(algo => algo.id === currentAlgorithm);

    // Polling pour les calculs asynchrones (Celery)
    const { status: jobStatus } = useJobPolling(currentJobId, {
        onSuccess: (result) => {
            // Le résultat peut être directement les données ou encapsulé
            const graphData = result.graph_data || result;
            if (graphData && graphData.nodes && graphData.nodes.length > 0) {
                onLayoutUpdate(graphData);
                addToast('Disposition mise à jour avec succès', 'success');
            } else {
                console.warn("Layout update returned empty or invalid data", result);
                addToast('Le calcul a réussi mais aucune donnée n\'a été retournée', 'warning');
            }
            setCurrentJobId(null);
            setIsLoading(false);
        },
        onError: (error) => {
            addToast(error || 'Erreur lors du calcul de la disposition', 'error');
            setCurrentJobId(null);
            setIsLoading(false);
        }
    });

    const handleAlgorithmChange = async (algorithm: string) => {
        setIsLoading(true);
        setIsOpen(false);

        // Notify parent immediately of algorithm change
        if (onAlgorithmChange) {
            onAlgorithmChange(algorithm);
        }

        try {
            let response: any;
            if (onLayoutRequest) {
                response = await onLayoutRequest(algorithm);
            } else if (projectId) {
                response = await apiClient.post(`/projects/${projectId}/layout`, { algorithm });
            } else {
                throw new Error("Configuration invalide pour LayoutSelector");
            }

            // Gestion asynchrone (Celery)
            if (response && response.job_id) {
                setCurrentJobId(response.job_id);
                // isLoading reste true jusqu'à la fin du polling
            }
            // Gestion synchrone
            else if (response && response.graph_data) {
                onLayoutUpdate(response.graph_data);
                setIsLoading(false);
            } else {
                // Fallback si format inattendu
                console.warn("Format de réponse inattendu", response);
                onLayoutUpdate(response); // Tentative d'utilisation directe
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error('Layout update error:', error);
            addToast(error.message || 'Erreur lors de la mise à jour du layout', 'error');
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className="group relative flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-pink-500/20 hover:text-white hover:scale-105 cursor-pointer"
                title={currentLayout ? `Layout actuel : ${currentLayout.label}` : "Changer la disposition"}
            >
                {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                )}
                <span className="hidden sm:inline">Layout</span>
                {currentLayout && (
                    <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        {currentLayout.label}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-2 space-y-1">
                        {ALGORITHMS.map((algo) => {
                            const isActive = algo.id === currentAlgorithm;
                            return (
                                <button
                                    key={algo.id}
                                    onClick={() => handleAlgorithmChange(algo.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors group relative ${isActive ? 'bg-green-500/10 border border-green-500/30' : 'hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-white group-hover:text-pink-400 transition-colors">
                                            {algo.label}
                                        </div>
                                        {isActive && (
                                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{algo.description}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
