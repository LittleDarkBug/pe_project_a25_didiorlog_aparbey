'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            if (user && user.role !== 'admin' && !user.is_superuser) {
                router.push('/dashboard');
            }
        } else if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [user, isAuthenticated, isLoading, router]);

    if (isLoading || !user || (user.role !== 'admin' && !user.is_superuser)) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full animate-fade-in">
            {children}
        </div>
    );
}
