'use client';

import { useEffect, useState } from 'react';
import { adminService, AdminStats } from '@/app/services/adminService';
import { Users, Folder, Activity, Globe } from 'lucide-react';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Skeleton';

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await adminService.getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-12" />
                                </div>
                                <Skeleton className="h-12 w-12 rounded-lg" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                <div className="rounded-full bg-red-500/10 p-4 text-red-500">
                    <Activity className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-surface-50">Erreur de chargement</h3>
                <p className="text-surface-400">Impossible de récupérer les statistiques. Veuillez réessayer.</p>
                <Button onClick={() => window.location.reload()}>Réessayer</Button>
            </div>
        );
    }

    const cards = [
        { label: 'Utilisateurs Total', value: stats.total_users, icon: Users, color: 'bg-blue-500/20 text-blue-400' },
        { label: 'Utilisateurs Actifs', value: stats.active_users, icon: Activity, color: 'bg-green-500/20 text-green-400' },
        { label: 'Projets Total', value: stats.total_projects, icon: Folder, color: 'bg-purple-500/20 text-purple-400' },
        { label: 'Projets Publics', value: stats.public_projects, icon: Globe, color: 'bg-orange-500/20 text-orange-400' },
    ];

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold text-surface-50">Administration</h1>
                <p className="mt-2 text-surface-400">Vue d'ensemble du système et gestion des ressources.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, index) => (
                    <Card key={index} className="p-6 border-surface-50/10 bg-surface-900/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-surface-400">{card.label}</p>
                                <p className="mt-2 text-3xl font-bold text-surface-50">{card.value}</p>
                            </div>
                            <div className={`rounded-lg p-3 ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
