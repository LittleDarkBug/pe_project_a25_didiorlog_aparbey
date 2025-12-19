'use client';

import { useEffect, useState } from 'react';
import { adminService, ProjectAdminView } from '@/app/services/adminService';
import { Search, Trash2, Globe, Lock } from 'lucide-react';
import { useToastStore } from '@/app/store/useToastStore';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Skeleton';

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<ProjectAdminView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { addToast } = useToastStore();

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const data = await adminService.getProjects(0, 100, search);
            setProjects(data);
        } catch (error) {
            addToast('error', 'Erreur', 'Impossible de charger les projets');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadProjects();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleDelete = async (projectId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) return;
        try {
            await adminService.deleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
            addToast('success', 'Succès', 'Projet supprimé');
        } catch (error) {
            addToast('error', 'Erreur', 'Suppression échouée');
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-surface-50">Gestion des Projets</h2>
                <div className="w-64">
                    <Input
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                    />
                </div>
            </div>

            <Card className="overflow-hidden border-surface-50/10 bg-surface-900/50 backdrop-blur-sm">
                <table className="w-full text-left text-sm text-surface-400">
                    <thead className="bg-surface-50/5 text-xs uppercase text-surface-300">
                        <tr>
                            <th className="px-6 py-3">Projet</th>
                            <th className="px-6 py-3">Propriétaire</th>
                            <th className="px-6 py-3">Visibilité</th>
                            <th className="px-6 py-3">Taille</th>
                            <th className="px-6 py-3">Date création</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-50/5">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : projects.length === 0 ? (
                            <tr><td colSpan={6} className="p-6 text-center">Aucun projet trouvé</td></tr>
                        ) : (
                            projects.map((project) => (
                                <tr key={project.id} className="hover:bg-surface-50/5">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-surface-50">{project.name}</div>
                                        <div className="text-xs text-surface-500">ID: {project.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.owner_email || 'Inconnu'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                            project.is_public ? 'bg-orange-500/20 text-orange-400' : 'bg-surface-500/20 text-surface-400'
                                        }`}>
                                            {project.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                            {project.is_public ? 'Public' : 'Privé'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs">
                                            {project.node_count} Nœuds<br/>
                                            {project.edge_count} Liens
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(project.id)}
                                            title="Supprimer"
                                            className="h-8 w-8 p-0"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-400" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
