'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/app/hooks/useAuth';
import { useUIStore } from '@/app/store/useUIStore';
import {
    LayoutDashboard,
    FolderOpen,
    Settings,
    LogOut,
    User,
    Users,
    Shield,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { useRouter } from 'next/navigation';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, fetchUser } = useAuth();
    const { isSidebarCollapsed, toggleSidebar } = useUIStore();
    const { theme, setTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showLogoutWarning, setShowLogoutWarning] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!user) {
            fetchUser();
        }
    }, [user, fetchUser]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const navigation = [
        { name: 'Profil', href: '/profile', icon: User },
    ];

    // Add Admin link if user is admin
    if (user?.role === 'admin') {
        navigation.unshift(
            { name: 'Vue d\'ensemble', href: '/admin', icon: LayoutDashboard },
            { name: 'Utilisateurs', href: '/admin/users', icon: Users },
            { name: 'Projets', href: '/admin/projects', icon: FolderOpen }
        );
    } else {
        // Only regular users can see/create projects
        navigation.unshift({ name: 'Mes Projets', href: '/dashboard', icon: FolderOpen });
    }

    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-800 text-surface-50 md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X /> : <Menu />}
            </button>

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out
                bg-surface-900/95 backdrop-blur-xl border-r border-surface-50/10
                md:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                ${isSidebarCollapsed ? 'w-64 md:w-20' : 'w-64'}
            `}>
                {/* Desktop Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="hidden md:flex absolute -right-3 top-8 z-50 bg-surface-800 border border-surface-50/10 rounded-full p-1.5 text-gray-400 hover:text-surface-50 hover:bg-surface-700 transition-colors shadow-lg"
                >
                    {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className="flex h-full flex-col overflow-hidden">
                    {/* Logo */}
                    <div className="flex h-16 items-center justify-center border-b border-surface-50/10 min-h-[4rem]">
                        {isSidebarCollapsed ? (
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                                G
                            </span>
                        ) : (
                            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent animate-fade-in">
                                GraphXR
                            </h1>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navigation.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    title={isSidebarCollapsed ? item.name : ''}
                                    className={cn(
                                        "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                        active
                                            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                            : 'text-surface-400 hover:bg-surface-50/5 hover:text-surface-50',
                                        isSidebarCollapsed && 'justify-center px-2'
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 flex-shrink-0 transition-colors",
                                            active ? 'text-primary-400' : 'text-surface-500 group-hover:text-surface-50',
                                            !isSidebarCollapsed && 'mr-3'
                                        )}
                                    />
                                    {!isSidebarCollapsed && (
                                        <span className="animate-fade-in whitespace-nowrap">
                                            {item.name}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User & Logout */}
                    <div className="border-t border-surface-50/10 px-2 py-4 space-y-1">
                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={toggleTheme}
                                title={isSidebarCollapsed ? (theme === 'dark' ? "Mode Clair" : "Mode Sombre") : ""}
                                className={cn(
                                    "flex w-full items-center px-4 py-3 text-sm font-medium text-surface-400 rounded-lg hover:bg-surface-50/5 hover:text-surface-50 transition-colors",
                                    isSidebarCollapsed && 'justify-center px-2'
                                )}
                            >
                                {theme === 'dark' ? (
                                    <Sun className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                                ) : (
                                    <Moon className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                                )}
                                {!isSidebarCollapsed && <span className="animate-fade-in">{theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}</span>}
                            </button>
                        )}

                        <div className={cn("flex items-center mb-2 mt-2", isSidebarCollapsed ? 'justify-center px-0' : 'px-4')}>
                            <div className="h-8 w-8 min-w-[2rem] rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="ml-3 overflow-hidden animate-fade-in">
                                    <p className="text-sm font-medium text-surface-50 truncate max-w-[120px]">
                                        {user?.full_name || 'Utilisateur'}
                                    </p>
                                    <p className="text-xs text-surface-500 truncate max-w-[120px]">
                                        {user?.email}
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (!user?.is_elite && user?.role !== 'admin' && !user?.is_superuser) {
                                    setShowLogoutWarning(true);
                                } else {
                                    logout.mutate();
                                }
                            }}
                            title={isSidebarCollapsed ? "Déconnexion" : ""}
                            className={cn(
                                "flex w-full items-center px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors",
                                isSidebarCollapsed && 'justify-center px-2'
                            )}
                        >
                            <LogOut className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                            {!isSidebarCollapsed && <span className="animate-fade-in">Déconnexion</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Modal
                isOpen={showLogoutWarning}
                onClose={() => setShowLogoutWarning(false)}
                title="⚠️ Attention : Compte Gratuit"
                footer={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setShowLogoutWarning(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setShowLogoutWarning(false);
                                router.push('/dashboard'); // Go to dashboard to export
                            }}
                        >
                            Exporter mes données
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                setShowLogoutWarning(false);
                                logout.mutate();
                            }}
                        >
                            Supprimer et Partir
                        </Button>
                    </div>
                }
            >
                <div className="text-surface-300 space-y-4">
                    <p>
                        Vous utilisez un compte <span className="font-bold text-accent-400">Gratuit</span>.
                    </p>
                    <p>
                        Vos projets sont stockés de manière <strong>temporaire</strong>. Si vous vous déconnectez maintenant, ils seront <span className="font-bold text-red-400">DÉFINITIVEMENT SUPPRIMÉS</span>.
                    </p>
                    <p>
                        Nous vous recommandons d'exporter vos projets avant de vous déconnecter.
                    </p>
                    <div className="p-4 bg-surface-950/50 rounded-lg border border-surface-50/10">
                        <h4 className="font-semibold text-surface-200 mb-2">Comment garder mes projets ?</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            <li>Exportez vos données (JSON/Report)</li>
                            <li>Demandez un accès <strong>Élite</strong> pour une sauvegarde permanente.</li>
                        </ul>
                    </div>
                </div>
            </Modal>
        </>
    );
}
