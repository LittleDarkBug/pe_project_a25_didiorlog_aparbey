'use client';

import { useState, useEffect, useMemo } from 'react';

interface FilterPanelProps {
    nodes: any[];
    edges: any[];
    onFilterChange: (visibleNodeIds: Set<string> | null) => void;
    onClose: () => void;
}

export default function FilterPanel({ nodes, edges, onFilterChange, onClose }: FilterPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
    const [activeTab, setActiveTab] = useState<'attributes' | 'topology'>('attributes');

    // Topology State
    const [sourceNodeId, setSourceNodeId] = useState('');
    const [targetNodeId, setTargetNodeId] = useState('');
    const [topologyMode, setTopologyMode] = useState<'neighbors' | 'path' | null>(null);
    const [hopCount, setHopCount] = useState(1);

    // Build Adjacency List for Topology Ops
    const adjacencyList = useMemo(() => {
        const adj: Record<string, string[]> = {};
        edges.forEach(edge => {
            if (!adj[edge.source]) adj[edge.source] = [];
            if (!adj[edge.target]) adj[edge.target] = [];
            adj[edge.source].push(edge.target);
            adj[edge.target].push(edge.source); // Undirected for now
        });
        return adj;
    }, [edges]);

    // Extract available categories dynamically
    const categories = useMemo(() => {
        const cats: Record<string, Set<string>> = {};

        nodes.forEach(node => {
            Object.entries(node).forEach(([key, value]) => {
                // Skip internal or non-categorical keys
                if (['id', 'x', 'y', 'z', 'color', 'label', 'vx', 'vy', 'vz', 'index'].includes(key)) return;

                // Only consider string or number values as categories
                if (typeof value === 'string' || typeof value === 'number') {
                    if (!cats[key]) cats[key] = new Set();
                    cats[key].add(String(value));
                }
            });
        });

        // Filter out categories with too many unique values (likely unique IDs)
        // or too few (useless)
        return Object.entries(cats)
            .filter(([_, values]) => values.size > 1 && values.size < 50)
            .reduce((acc, [key, values]) => {
                acc[key] = Array.from(values).sort();
                return acc;
            }, {} as Record<string, string[]>);
    }, [nodes]);

    // Apply filters
    useEffect(() => {
        // 1. Topology Filters (Priority)
        if (topologyMode) {
            const visibleIds = new Set<string>();

            if (topologyMode === 'neighbors' && sourceNodeId) {
                // BFS for N hops
                const queue: Array<[string, number]> = [[sourceNodeId, 0]];
                const visited = new Set([sourceNodeId]);
                visibleIds.add(sourceNodeId);

                while (queue.length > 0) {
                    const item = queue.shift();
                    if (!item) continue;
                    const [currentId, dist] = item;
                    if (dist >= hopCount) continue;

                    const neighbors = adjacencyList[currentId] || [];
                    for (const neighbor of neighbors) {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            visibleIds.add(neighbor);
                            queue.push([neighbor, dist + 1]);
                        }
                    }
                }
                onFilterChange(visibleIds);
                return;
            }

            if (topologyMode === 'path' && sourceNodeId && targetNodeId) {
                // BFS for Shortest Path
                const queue: string[][] = [[sourceNodeId]];
                const visited = new Set([sourceNodeId]);
                const parent: Record<string, string> = {};

                let found = false;
                while (queue.length > 0) {
                    const path = queue.shift();
                    if (!path) continue;
                    const node = path[path.length - 1];

                    if (node === targetNodeId) {
                        path.forEach(id => visibleIds.add(id));
                        found = true;
                        break;
                    }

                    const neighbors = adjacencyList[node] || [];
                    for (const neighbor of neighbors) {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push([...path, neighbor]);
                        }
                    }
                }

                if (found) {
                    onFilterChange(visibleIds);
                } else {
                    // No path found, maybe show nothing or just source/target?
                    // For now, show nothing to indicate no path
                    onFilterChange(new Set());
                }
                return;
            }
        }

        // 2. Attribute Filters (Default)
        // If no filters active, return null (show all)
        if (!searchTerm && Object.keys(activeFilters).length === 0 && !topologyMode) {
            onFilterChange(null);
            return;
        }

        if (!topologyMode) {
            const visibleIds = new Set<string>();

            nodes.forEach(node => {
                let matches = true;

                // 1. Text Search (ID or Label)
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    const idMatch = node.id.toLowerCase().includes(term);
                    const labelMatch = node.label?.toLowerCase().includes(term);
                    if (!idMatch && !labelMatch) matches = false;
                }

                // 2. Category Filters
                if (matches) {
                    for (const [key, selectedValues] of Object.entries(activeFilters)) {
                        if (selectedValues.size > 0) {
                            const nodeValue = String(node[key]);
                            if (!selectedValues.has(nodeValue)) {
                                matches = false;
                                break;
                            }
                        }
                    }
                }

                if (matches) {
                    visibleIds.add(node.id);
                }
            });

            onFilterChange(visibleIds);
        }
    }, [searchTerm, activeFilters, nodes, onFilterChange, topologyMode, sourceNodeId, targetNodeId, hopCount, adjacencyList]);

    const toggleFilter = (category: string, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            if (!newFilters[category]) newFilters[category] = new Set();

            if (newFilters[category].has(value)) {
                newFilters[category].delete(value);
                if (newFilters[category].size === 0) delete newFilters[category];
            } else {
                newFilters[category].add(value);
            }
            return newFilters;
        });
    };

    return (
        <div className="fixed z-50 w-80 flex flex-col max-h-[70vh] animate-slide-up rounded-xl border border-surface-50/10 bg-surface-950/95 backdrop-blur-xl shadow-2xl"
            style={{ left: '2rem', bottom: '6rem' }}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-50/10 bg-surface-950/95 rounded-t-xl shrink-0">
                <h3 className="text-lg font-bold text-surface-50 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtres
                </h3>
                <button onClick={onClose} className="rounded-full p-1 text-surface-400 hover:bg-surface-50/10 hover:text-surface-50 transition-colors cursor-pointer">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-50/10">
                <button
                    onClick={() => { setActiveTab('attributes'); setTopologyMode(null); }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'attributes'
                        ? 'text-primary-400 border-b-2 border-primary-400 bg-surface-50/5'
                        : 'text-surface-400 hover:text-surface-200'
                        }`}
                >
                    Attributs
                </button>
                <button
                    onClick={() => setActiveTab('topology')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'topology'
                        ? 'text-primary-400 border-b-2 border-primary-400 bg-surface-50/5'
                        : 'text-surface-400 hover:text-surface-200'
                        }`}
                >
                    Topologie
                </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {activeTab === 'attributes' ? (
                    <>
                        {/* Search */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-surface-400">Recherche Rapide</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Filtrer par ID ou Label..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-surface-900/50 border border-surface-50/10 rounded-lg px-4 py-2 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-50 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Dynamic Categories */}
                        {Object.entries(categories).map(([category, values]) => (
                            <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-primary-400">{category}</label>
                                    <span className="text-[10px] bg-surface-50/10 px-1.5 py-0.5 rounded text-surface-400">{values.length}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {values.map(value => {
                                        const isActive = activeFilters[category]?.has(value);
                                        return (
                                            <button
                                                key={value}
                                                onClick={() => toggleFilter(category, value)}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${isActive
                                                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-100'
                                                    : 'bg-surface-50/5 border-surface-50/10 text-surface-400 hover:border-surface-50/30 hover:text-surface-200'
                                                    }`}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {Object.keys(categories).length === 0 && (
                            <div className="text-center py-8 text-surface-500 text-sm italic">
                                Aucune catégorie filtrable détectée dans les données.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-6">
                        {/* Neighbors Filter */}
                        <div className="space-y-3 p-3 rounded-lg bg-surface-50/5 border border-surface-50/10">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Voisinage
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="ID du Nœud Central"
                                    value={sourceNodeId}
                                    onChange={(e) => setSourceNodeId(e.target.value)}
                                    className="w-full bg-surface-900/50 border border-surface-50/10 rounded-lg px-3 py-2 text-sm text-surface-50 focus:outline-none focus:border-primary-500/50"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-surface-400">Profondeur:</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={hopCount}
                                        onChange={(e) => setHopCount(parseInt(e.target.value))}
                                        className="flex-1 h-1 bg-surface-50/20 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xs font-mono text-primary-400 w-4">{hopCount}</span>
                                </div>
                                <button
                                    onClick={() => setTopologyMode(topologyMode === 'neighbors' ? null : 'neighbors')}
                                    disabled={!sourceNodeId}
                                    className={`w-full py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${topologyMode === 'neighbors'
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                        : 'bg-surface-50/10 text-surface-300 hover:bg-surface-50/20 hover:text-surface-100'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {topologyMode === 'neighbors' ? 'Désactiver' : 'Afficher Voisins'}
                                </button>
                            </div>
                        </div>

                        {/* Path Filter */}
                        <div className="space-y-3 p-3 rounded-lg bg-surface-50/5 border border-surface-50/10">
                            <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Chemin Court
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Départ (ID)"
                                    value={sourceNodeId}
                                    onChange={(e) => setSourceNodeId(e.target.value)}
                                    className="w-full bg-surface-900/50 border border-surface-50/10 rounded-lg px-3 py-2 text-sm text-surface-50 focus:outline-none focus:border-purple-500/50"
                                />
                                <input
                                    type="text"
                                    placeholder="Arrivée (ID)"
                                    value={targetNodeId}
                                    onChange={(e) => setTargetNodeId(e.target.value)}
                                    className="w-full bg-surface-900/50 border border-surface-50/10 rounded-lg px-3 py-2 text-sm text-surface-50 focus:outline-none focus:border-purple-500/50"
                                />
                                <button
                                    onClick={() => setTopologyMode(topologyMode === 'path' ? null : 'path')}
                                    disabled={!sourceNodeId || !targetNodeId}
                                    className={`w-full py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${topologyMode === 'path'
                                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-surface-50/10 text-surface-300 hover:bg-surface-50/20 hover:text-surface-100'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {topologyMode === 'path' ? 'Désactiver' : 'Trouver Chemin'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with Clear All */}
            <div className="p-3 border-t border-surface-50/10 bg-surface-900/30 flex items-center justify-between">
                <p className="text-xs text-surface-400">
                    {(searchTerm || Object.keys(activeFilters).length > 0 || topologyMode)
                        ? "Filtres actifs"
                        : "Tous les éléments"}
                </p>
                {(searchTerm || Object.keys(activeFilters).length > 0 || topologyMode) && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setActiveFilters({});
                            setTopologyMode(null);
                            setSourceNodeId('');
                            setTargetNodeId('');
                            onFilterChange(null);
                        }}
                        className="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Effacer tout
                    </button>
                )}
            </div>
        </div>
    );
}
