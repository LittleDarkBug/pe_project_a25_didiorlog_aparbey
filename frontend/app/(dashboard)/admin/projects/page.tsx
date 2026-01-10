'use client';

import { useEffect, useState } from 'react';
import { adminService, ProjectAdminView } from '@/app/services/adminService';
import { Search, Trash2, Globe, Lock, Eye, Edit2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useToastStore } from '@/app/store/useToastStore';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Skeleton';
import { Modal } from '@/app/components/ui/Modal';
import { useRouter } from 'next/navigation';

export default function AdminProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectAdminView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToastStore();

    // Pagination & Filters
    const [page, setPage] = useState(1);
    const limit = 10;
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterPublic, setFilterPublic] = useState<boolean | undefined>(undefined); // undefined=all, true=public, false=private

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectAdminView | null>(null);
    const [editForm, setEditForm] = useState({ name: '', is_public: false });
    const [isSaving, setIsSaving] = useState(false);

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const skip = (page - 1) * limit;
            const data = await adminService.getProjects(skip, limit, search, sortBy, sortOrder, filterPublic);
            setProjects(data);
        } catch (error) {
            addToast('Impossible de charger les projets', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeout = setTimeout(() => {
            loadProjects();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search, sortBy, sortOrder, filterPublic]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const handleDelete = async (projectId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) return;
        try {
            await adminService.deleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
            addToast('Projet supprimé', 'success');
        } catch (error) {
            addToast('Suppression échouée', 'error');
        }
    };

    const handleInspect = (projectId: string) => {
        router.push(`/projects/${projectId}`);
    };

    const openEdit = (project: ProjectAdminView) => {
        setEditingProject(project);
        setEditForm({ name: project.name, is_public: project.is_public });
        setIsEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingProject) return;
        setIsSaving(true);
        try {
            const updated = await adminService.updateProject(editingProject.id, {
                name: editForm.name,
                is_public: editForm.is_public
            });

            setProjects(projects.map(p => p.id === updated.id ? updated : p));
            addToast('Projet mis à jour', 'success');
            setIsEditOpen(false);
        } catch (error) {
            addToast('Mise à jour échouée', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const renderSortIcon = (field: string) => {
        if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
        return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary-400" /> : <ArrowDown className="h-3 w-3 text-primary-400" />;
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-surface-50">Gestion des Projets</h2>
                    <p className="text-sm text-surface-400">Gérez, inspectez et modifiez tous les projets de la plateforme.</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={filterPublic === undefined ? 'primary' : 'ghost'}
                        onClick={() => { setFilterPublic(undefined); setPage(1); }}
                    >
                        Tous
                    </Button>
                    <Button
                        size="sm"
                        variant={filterPublic === true ? 'primary' : 'ghost'}
                        onClick={() => { setFilterPublic(true); setPage(1); }}
                    >
                        Publics
                    </Button>
                    <Button
                        size="sm"
                        variant={filterPublic === false ? 'primary' : 'ghost'}
                        onClick={() => { setFilterPublic(false); setPage(1); }}
                    >
                        Privés
                    </Button>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="w-full max-w-md">
                    <Input
                        placeholder="Rechercher un projet..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        leftIcon={<Search className="h-4 w-4" />}
                    />
                </div>
            </div>

            <Card className="overflow-hidden border-surface-50/10 bg-surface-900/50 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-surface-400">
                        <thead className="bg-surface-50/5 text-xs uppercase text-surface-300">
                            <tr>
                                <th className="px-6 py-3 cursor-pointer hover:bg-surface-50/10 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">Projet {renderSortIcon('name')}</div>
                                </th>
                                <th className="px-6 py-3">Propriétaire</th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-surface-50/10 transition-colors" onClick={() => handleSort('is_public')}>
                                    <div className="flex items-center gap-2">Visibilité {renderSortIcon('is_public')}</div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-surface-50/10 transition-colors" onClick={() => handleSort('node_count')}>
                                    <div className="flex items-center gap-2">Taille {renderSortIcon('node_count')}</div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:bg-surface-50/10 transition-colors" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center gap-2">Création {renderSortIcon('created_at')}</div>
                                </th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-50/5">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-3 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : projects.length === 0 ? (
                                <tr><td colSpan={6} className="p-6 text-center py-12">Aucun projet trouvé</td></tr>
                            ) : (
                                projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-surface-50/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-surface-50">{project.name}</div>
                                            <div className="text-xs text-surface-500 font-mono opacity-50">{project.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
                                                    {project.owner_email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <span className="truncate max-w-[150px]" title={project.owner_email}>
                                                    {project.owner_email || 'Inconnu'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${project.is_public
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-surface-500/10 text-surface-400 border-surface-500/20'
                                                }`}>
                                                {project.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                                {project.is_public ? 'Public' : 'Privé'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    {project.node_count} Nœuds
                                                </div>
                                                <div className="flex items-center gap-1 opacity-70">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                    {project.edge_count} Liens
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-surface-400">
                                            {new Date(project.created_at).toLocaleDateString()}
                                            <div className="opacity-50 text-[10px]">
                                                {new Date(project.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleInspect(project.id)}
                                                    title="Inspecter / Ouvrir"
                                                    className="w-8 h-8 p-0"
                                                >
                                                    <Eye className="h-4 w-4 text-blue-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(project)}
                                                    title="Modifier"
                                                    className="w-8 h-8 p-0"
                                                >
                                                    <Edit2 className="h-4 w-4 text-orange-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(project.id)}
                                                    title="Supprimer"
                                                    className="w-8 h-8 p-0 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-surface-50/10 px-6 py-4 bg-surface-900/30">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        leftIcon={<ChevronLeft className="h-4 w-4" />}
                    >
                        Précédent
                    </Button>
                    <span className="text-sm text-surface-400 font-medium">Page {page}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={projects.length < limit || isLoading}
                        onClick={() => setPage(p => p + 1)}
                        rightIcon={<ChevronRight className="h-4 w-4" />}
                    >
                        Suivant
                    </Button>
                </div>
            </Card>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Modifier le projet"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isSaving}>Annuler</Button>
                        <Button onClick={handleSaveEdit} isLoading={isSaving}>Enregistrer</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nom du projet"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Project Name"
                    />
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 border border-surface-50/10">
                        <div className={`p-2 rounded-full ${editForm.is_public ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-600/20 text-surface-400'}`}>
                            {editForm.is_public ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-surface-50">Visibilité Publique</h4>
                            <p className="text-xs text-surface-400">
                                {editForm.is_public ? "Visible par tous les utilisateurs via le lien." : "Visible uniquement par le propriétaire et les admins."}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={editForm.is_public}
                                onChange={(e) => setEditForm(prev => ({ ...prev, is_public: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
