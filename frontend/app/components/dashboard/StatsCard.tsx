import React from 'react';

interface StatsCardProps {
    stats: {
        node_count: number;
        edge_count: number;
        density: number;
        is_connected: boolean;
        sample_size: number;
    };
}

export default function StatsCard({ stats }: StatsCardProps) {
    return (
        <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
            <h4 className="mb-2 text-sm font-semibold text-blue-400 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyse préliminaire (sur {stats.sample_size} lignes)
            </h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                    <p className="text-xs text-gray-400">Nœuds détectés</p>
                    <p className="text-lg font-bold text-white">{stats.node_count}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Liens détectés</p>
                    <p className="text-lg font-bold text-white">{stats.edge_count}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Densité</p>
                    <p className="text-lg font-bold text-white">{stats.density}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Connecté ?</p>
                    <p className="text-lg font-bold text-white">
                        {stats.is_connected ? (
                            <span className="text-green-400">Oui</span>
                        ) : (
                            <span className="text-yellow-400">Non</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
