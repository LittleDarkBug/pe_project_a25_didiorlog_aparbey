'use client';

import { useState } from 'react';
import { apiClient } from '@/app/lib/apiClient';
import { useToastStore } from '@/app/store/useToastStore';

interface LayoutSelectorProps {
    projectId: string;
    onLayoutUpdate: (newGraphData: any) => void;
}

const ALGORITHMS = [
    { id: 'fruchterman_reingold', label: 'Fruchterman-Reingold (3D)', description: 'Standard, équilibré' },
    { id: 'kamada_kawai', label: 'Kamada-Kawai (3D)', description: 'Esthétique, basé sur l\'énergie' },
    { id: 'drl', label: 'DrL (3D)', description: 'Rapide pour grands graphes' },
    { id: 'sphere', label: 'Sphérique', description: 'Projection sur une sphère' },
    { id: 'grid', label: 'Grille 3D', description: 'Alignement sur grille' },
    { id: 'random', label: 'Aléatoire', description: 'Chaos total' },
    { id: 'circular', label: 'Circulaire', description: 'En cercle (2D+Z)' },
];

export default function LayoutSelector({ projectId, onLayoutUpdate }: LayoutSelectorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToastStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleAlgorithmChange = async (algorithm: string) => {
        setIsLoading(true);
        setIsOpen(false);
        try {
            const response: any = await apiClient.post(`/projects/${projectId}/layout`, { algorithm });
            onLayoutUpdate(response.graph_data);
            addToast('Layout mis à jour avec succès', 'success');
        } catch (error: any) {
            console.error('Layout update error:', error);
            addToast(error.message || 'Erreur lors de la mise à jour du layout', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className="group relative flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-pink-500/20 hover:text-white hover:scale-105 cursor-pointer"
                title="Changer la disposition"
            >
                {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                )}
                <span className="hidden sm:inline">Vues</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-2 space-y-1">
                        {ALGORITHMS.map((algo) => (
                            <button
                                key={algo.id}
                                onClick={() => handleAlgorithmChange(algo.id)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group"
                            >
                                <div className="font-medium text-white group-hover:text-pink-400 transition-colors">{algo.label}</div>
                                <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{algo.description}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
