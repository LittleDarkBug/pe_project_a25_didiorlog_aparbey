'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser, useUpdateProfile } from '@/app/hooks/useUsers';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Skeleton';
import { User, Mail, Lock, Save, Shield } from 'lucide-react';

export default function ProfilePage() {
    const { data: user, isLoading } = useCurrentUser();
    const updateProfile = useUpdateProfile();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Update form data when user data is loaded
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.full_name || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const updateData: any = {
            full_name: formData.full_name,
            email: formData.email
        };

        if (formData.password) {
            if (formData.password !== formData.confirmPassword) {
                // Toast handled by hook or we can add local validation error state
                alert("Les mots de passe ne correspondent pas"); // Temporary, should use toast
                return;
            }
            updateData.password = formData.password;
        }

        updateProfile.mutate(updateData);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-9 w-32 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Summary Card Skeleton */}
                    <Card className="md:col-span-1 p-6 flex flex-col items-center space-y-4 h-fit">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2 w-full flex flex-col items-center">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="w-full pt-4 border-t border-surface-50/10">
                            <Skeleton className="h-3 w-24 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </Card>

                    {/* Edit Form Card Skeleton */}
                    <Card className="md:col-span-2 p-8">
                        <Skeleton className="h-7 w-64 mb-6" />
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-10 w-full" />
                            </div>

                            <div className="border-t border-surface-50/10 my-6 pt-6">
                                <Skeleton className="h-4 w-20 mb-4" />
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Skeleton className="h-10 w-64" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-surface-50">Mon Profil</h1>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">{user?.role || 'Utilisateur'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Summary Card */}
                <Card className="md:col-span-1 p-6 flex flex-col items-center text-center space-y-4 h-fit">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-primary-500/20">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-surface-50">{user?.full_name || 'Utilisateur'}</h2>
                        <p className="text-surface-400 text-sm">{user?.email}</p>
                    </div>
                    <div className="w-full pt-4 border-t border-surface-50/10">
                        <div className="text-xs text-surface-500 uppercase tracking-wider mb-2">Membre depuis</div>
                        <div className="text-sm text-surface-300">
                            {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : '-'}
                        </div>
                    </div>
                </Card>

                {/* Edit Form Card */}
                <Card className="md:col-span-2 p-8">
                    <h3 className="text-xl font-semibold text-surface-50 mb-6">Modifier mes informations</h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="Nom complet"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                leftIcon={<User className="h-5 w-5" />}
                                placeholder="Votre nom"
                            />

                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                leftIcon={<Mail className="h-5 w-5" />}
                                placeholder="votre@email.com"
                            />

                            <div className="border-t border-surface-50/10 my-6 pt-6">
                                <h4 className="text-sm font-medium text-surface-400 mb-4 uppercase tracking-wider">Sécurité</h4>
                                <div className="space-y-6">
                                    <Input
                                        label="Nouveau mot de passe"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        leftIcon={<Lock className="h-5 w-5" />}
                                        placeholder="Laisser vide pour ne pas changer"
                                    />

                                    <Input
                                        label="Confirmer le mot de passe"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        leftIcon={<Lock className="h-5 w-5" />}
                                        placeholder="Confirmer le nouveau mot de passe"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                isLoading={updateProfile.isPending}
                                leftIcon={<Save className="h-4 w-4" />}
                            >
                                Enregistrer les modifications
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
