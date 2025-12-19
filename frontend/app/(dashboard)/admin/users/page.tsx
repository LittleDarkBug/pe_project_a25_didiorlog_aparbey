'use client';

import { useEffect, useState } from 'react';
import { adminService, UserAdminView } from '@/app/services/adminService';
import { Search, Trash2, Shield, Ban, CheckCircle, Plus } from 'lucide-react';
import { useToastStore } from '@/app/store/useToastStore';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Skeleton';
import CreateUserModal from '@/app/components/admin/CreateUserModal';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserAdminView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { addToast } = useToastStore();

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await adminService.getUsers(0, 100, search);
            setUsers(data);
        } catch (error) {
            addToast('error', 'Erreur', 'Impossible de charger les utilisateurs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadUsers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleToggleActive = async (user: UserAdminView) => {
        try {
            const updated = await adminService.updateUser(user.id, { is_active: !user.is_active });
            setUsers(users.map(u => u.id === user.id ? updated : u));
            addToast('success', 'Succès', `Utilisateur ${updated.is_active ? 'activé' : 'désactivé'}`);
        } catch (error) {
            addToast('error', 'Erreur', 'Mise à jour échouée');
        }
    };

    const handleToggleAdmin = async (user: UserAdminView) => {
        try {
            const newRole = user.role === 'admin' ? 'user' : 'admin';
            const updated = await adminService.updateUser(user.id, { role: newRole });
            setUsers(users.map(u => u.id === user.id ? updated : u));
            addToast('success', 'Succès', `Rôle mis à jour : ${newRole}`);
        } catch (error) {
            addToast('error', 'Erreur', 'Mise à jour échouée');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        try {
            await adminService.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            addToast('success', 'Succès', 'Utilisateur supprimé');
        } catch (error) {
            addToast('error', 'Erreur', 'Suppression échouée');
        }
    };

    const handleUserCreated = (newUser: UserAdminView) => {
        setUsers([newUser, ...users]);
        setIsCreateModalOpen(false);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-surface-50">Gestion des Utilisateurs</h2>
                <div className="flex gap-4">
                    <div className="w-64">
                        <Input
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftIcon={<Search className="h-4 w-4" />}
                        />
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
                        Nouveau
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-surface-50/10 bg-surface-900/50 backdrop-blur-sm">
                <table className="w-full text-left text-sm text-surface-400">
                    <thead className="bg-surface-50/5 text-xs uppercase text-surface-300">
                        <tr>
                            <th className="px-6 py-3">Utilisateur</th>
                            <th className="px-6 py-3">Rôle</th>
                            <th className="px-6 py-3">Statut</th>
                            <th className="px-6 py-3">Date création</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-50/5">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="p-6 text-center">Aucun utilisateur trouvé</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-surface-50/5">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-surface-50">{user.full_name || 'Sans nom'}</div>
                                        <div className="text-xs">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                            user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-surface-500/20 text-surface-400'
                                        }`}>
                                            {user.role === 'admin' && <Shield className="h-3 w-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                            user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'

                                        }`}>
                                            {user.is_active ? 'Actif' : 'Banni'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleActive(user)}
                                                title={user.is_active ? "Bannir" : "Activer"}
                                                className="h-8 w-8 p-0"
                                            >
                                                {user.is_active ? <Ban className="h-4 w-4 text-red-400" /> : <CheckCircle className="h-4 w-4 text-green-400" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleAdmin(user)}
                                                title="Changer rôle"
                                                className="h-8 w-8 p-0"
                                            >
                                                <Shield className={`h-4 w-4 ${user.role === 'admin' ? 'text-purple-400' : 'text-gray-400'}`} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(user.id)}
                                                title="Supprimer"
                                                className="h-8 w-8 p-0"
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
            </Card>

            {isCreateModalOpen && (
                <CreateUserModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleUserCreated}
                />
            )}
        </div>
    );
}
