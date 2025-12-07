'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import ImportWizard from '@/app/components/dashboard/ImportWizard';
import { projectsService } from '@/app/services/projectsService';

// Mock data for now
const MOCK_PROJECTS = [
    { id: '1', name: 'Réseau Social', nodes: 1250, edges: 5400, date: 'Il y a 2h' },
    { id: '2', name: 'Interactions Protéines', nodes: 340, edges: 890, date: 'Il y a 1j' },
];

export default function DashboardPage() {
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const router = useRouter();

    const filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const data = await projectsService.list();
            // Formatter les dates et données pour l'affichage
            const formatted = data.map(p => ({
                id: p.id,
                name: p.name,
                nodes: p.stats?.node_count || p.stats?.nodes || 0,
                edges: p.stats?.edge_count || p.stats?.edges || 0,
                date: new Date(p.created_at || Date.now()).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })
            }));
            setProjects(formatted);
        } catch (error) {
            console.error("Erreur chargement projets", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleProjectCreated = (project?: any) => {
        console.log('handleProjectCreated appelé avec:', project);
        if (project && project.id) {
            router.push(`/projects/${project.id}`);
        } else {
            console.log('Pas de projet/ID, rafraîchissement de la liste');
            fetchProjects();
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Empêcher la navigation
        if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
            try {
                await projectsService.delete(id);
                fetchProjects();
            } catch (error) {
                console.error("Erreur suppression", error);
                alert("Erreur lors de la suppression");
            }
        }
    };

    const handleCardClick = (id: string) => {
        router.push(`/projects/${id}`);
    };

    return (
        <div className="animate-fade-in h-full" onClick={() => setOpenMenuId(null)}>
            {/* Sticky Header Section */}
            <div className="sticky top-0 z-10 bg-surface-950/95 backdrop-blur-xl pb-6 pt-2 -mx-4 px-4 md:-mx-8 md:px-8 space-y-6 border-b border-surface-50/5 mb-8 transition-all duration-200">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
                    <div>
                        <h1 className="text-3xl font-bold text-surface-50">Mes Projets</h1>
                        <p className="text-surface-400">Gérez et visualisez vos graphes.</p>
                    </div>
                    <button
                        onClick={() => setIsWizardOpen(true)}
                        className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-blue-400 hover-glow-blue btn-press"
                    >
                        <svg className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nouveau Projet
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-surface-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-surface-50/10 rounded-xl leading-5 bg-surface-50/5 text-surface-50 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-200"
                        placeholder="Rechercher un projet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    // Skeleton loading
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 rounded-2xl border border-surface-50/10 bg-surface-50/5 animate-pulse"></div>
                    ))
                ) : (
                    filteredProjects.map((project, index) => (
                        <div
                            key={project.id}
                            onClick={() => handleCardClick(project.id)}
                            className="group relative overflow-hidden rounded-2xl border border-surface-50/10 bg-surface-50/5 p-6 card-hover hover:border-blue-500/50 hover:bg-blue-500/5 hover-glow-blue animate-scale-in cursor-pointer"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Animated Background Gradient */}
                            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:from-blue-500/20 group-hover:to-purple-500/20"></div>

                            <div className="relative z-10">
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 text-blue-400 transition-transform duration-300 group-hover:scale-110">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === project.id ? null : project.id); }}
                                            className="text-surface-400 transition-colors hover:text-surface-50 p-1 rounded-full hover:bg-surface-50/10"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                        </button>

                                        {openMenuId === project.id && (
                                            <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-surface-50/10 bg-surface-800 py-1 shadow-xl">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCardClick(project.id); }}
                                                    className="block w-full px-4 py-2 text-left text-sm text-surface-300 hover:bg-surface-50/5 hover:text-surface-50"
                                                >
                                                    Ouvrir
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                                    className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h3 className="mb-1 text-xl font-bold text-surface-50 transition-colors group-hover:text-blue-400">{project.name}</h3>
                                <p className="mb-4 text-sm text-surface-400">{project.date}</p>

                                <div className="flex items-center gap-4 border-t border-surface-50/10 pt-4">
                                    <div className="flex items-center gap-1.5 text-sm text-surface-300">
                                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        <span className="font-medium">{project.nodes.toLocaleString()}</span> Nœuds
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-surface-300">
                                        <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                                        <span className="font-medium">{project.edges.toLocaleString()}</span> Liens
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* New Project Card */}
                <button
                    onClick={() => setIsWizardOpen(true)}
                    className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-50/10 bg-transparent p-6 transition-all hover:border-blue-500/50 hover:bg-blue-500/5 card-hover animate-scale-in h-full min-h-[200px]"
                    style={{ animationDelay: `${projects.length * 0.1}s` }}
                >
                    <div className="mb-4 rounded-full bg-surface-50/5 p-4 text-surface-400 transition-all duration-300 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:scale-110">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="font-semibold text-surface-400 transition-colors group-hover:text-surface-50">Créer un projet</span>
                    <span className="mt-1 text-sm text-surface-500 transition-colors group-hover:text-surface-400">Import CSV/JSON</span>
                </button>
            </div>

            {/* Wizard Modal */}
            {isWizardOpen && (
                <ImportWizard
                    onClose={() => setIsWizardOpen(false)}
                    onSuccess={handleProjectCreated}
                />
            )}
        </div>
    );
}
