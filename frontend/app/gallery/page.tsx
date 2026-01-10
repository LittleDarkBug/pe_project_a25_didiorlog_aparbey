'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { projectsService, Project } from '@/app/services/projectsService';
import { ArrowLeft, Box, Share2, Search, ExternalLink } from 'lucide-react';

export default function GalleryPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectsService.getPublicProjects();
                setProjects(data);
            } catch (error) {
                console.error("Failed to fetch gallery:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-surface-950 text-surface-50 selection:bg-primary-500 selection:text-white">
            {/* Nav */}
            <nav className="fixed top-0 z-50 w-full border-b border-surface-50/10 bg-surface-950/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="text-sm font-medium">Retour</span>
                        </Link>
                        <div className="h-4 w-[1px] bg-surface-800"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-600"></div>
                            <span className="text-xl font-bold tracking-tight">Galerie</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="pt-32 pb-12 px-6">
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-surface-400 mb-6">
                            Explorez l'Univers des Données
                        </h1>
                        <p className="text-xl text-surface-400 max-w-2xl mx-auto">
                            Découvrez les visualisations créées par la communauté GraphXR.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto mb-12 relative animate-fade-in-up delay-100">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-surface-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher un projet..."
                            className="block w-full pl-10 pr-3 py-3 border border-surface-700 rounded-xl leading-5 bg-surface-900 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-64 rounded-2xl bg-surface-900 animate-pulse border border-surface-800"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredProjects.map((project, index) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Link href={`/projects/${project.id}`} className="group block h-full">
                                        <div className="h-full relative overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/50 backdrop-blur-sm transition-all duration-300 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1">
                                            {/* Preview Placeholder (Gradient) */}
                                            <div className={`h-40 w-full bg-gradient-to-br ${['from-blue-500/10 to-purple-500/10', 'from-emerald-500/10 to-teal-500/10', 'from-orange-500/10 to-red-500/10'][index % 3]
                                                } group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                                                <Box className="w-12 h-12 text-surface-600 group-hover:text-primary-400 transition-colors duration-300 transform group-hover:scale-110" />
                                            </div>

                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-surface-50 group-hover:text-primary-400 transition-colors">
                                                            {project.name}
                                                        </h3>
                                                        <p className="text-sm text-surface-500 mt-1 line-clamp-2">
                                                            {project.description || "Aucune description"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs font-medium text-surface-400 uppercase tracking-wider">
                                                    <div className="flex items-center gap-1.5 bg-surface-800/50 px-2 py-1 rounded-md">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                        {project.stats?.nodes || 0} Noeuds
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-surface-800/50 px-2 py-1 rounded-md">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                                        {project.stats?.edges || 0} Liens
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-center text-sm font-medium text-primary-400 group-hover:text-primary-300">
                                                    Voir le projet <ExternalLink className="ml-2 h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {!isLoading && filteredProjects.length === 0 && (
                        <div className="text-center py-24">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-900 text-surface-600 mb-6">
                                <Search className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-surface-300">Aucun projet trouvé</h3>
                            <p className="text-surface-500 mt-2">Essayez une autre recherche ou revenez plus tard.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
