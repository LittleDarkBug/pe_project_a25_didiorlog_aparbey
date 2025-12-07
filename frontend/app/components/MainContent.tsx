'use client';

import { useUIStore } from '@/app/store/useUIStore';

export function MainContent({ children }: { children: React.ReactNode }) {
    const { isSidebarCollapsed } = useUIStore();
    
    return (
        <main className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
            <div className="container mx-auto p-4 md:p-8 pt-20 md:pt-8">
                {children}
            </div>
        </main>
    );
}
