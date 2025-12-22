'use client';

import { useState } from 'react';
import { X, Mail, User, Lock, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { adminService, UserCreateData } from '@/app/services/adminService';
import { useToastStore } from '@/app/store/useToastStore';

interface CreateUserModalProps {
    onClose: () => void;
    onSuccess: (user: any) => void;
}

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
    const [formData, setFormData] = useState<UserCreateData>({
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        is_active: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToastStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const newUser = await adminService.createUser(formData);
            addToast('Utilisateur créé avec succès', 'success');
            onSuccess(newUser);
        } catch (error: any) {
            addToast(error.message || 'Impossible de créer l\'utilisateur', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-surface-50/10 bg-surface-900 p-6 shadow-xl animate-scale-in">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Nouvel Utilisateur</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        leftIcon={<Mail className="h-4 w-4" />}
                        placeholder="email@exemple.com"
                    />

                    <Input
                        label="Nom complet"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        leftIcon={<User className="h-4 w-4" />}
                        placeholder="John Doe"
                    />

                    <Input
                        label="Mot de passe"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        leftIcon={<Lock className="h-4 w-4" />}
                        placeholder="••••••••"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Rôle</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'user' })}
                                    className={`flex-1 rounded-lg border p-2 text-sm transition-colors ${formData.role === 'user'
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-surface-50/10 bg-surface-800 text-gray-400 hover:bg-surface-700'
                                        }`}
                                >
                                    Utilisateur
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                                    className={`flex-1 rounded-lg border p-2 text-sm transition-colors ${formData.role === 'admin'
                                            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                                            : 'border-surface-50/10 bg-surface-800 text-gray-400 hover:bg-surface-700'
                                        }`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Statut</label>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`flex w-full items-center justify-center gap-2 rounded-lg border p-2 text-sm transition-colors ${formData.is_active
                                        ? 'border-green-500 bg-green-500/10 text-green-400'
                                        : 'border-red-500 bg-red-500/10 text-red-400'
                                    }`}
                            >
                                {formData.is_active ? (
                                    <>
                                        <CheckCircle className="h-4 w-4" /> Actif
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-4 w-4" /> Inactif
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-surface-50/10">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            Créer l'utilisateur
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
