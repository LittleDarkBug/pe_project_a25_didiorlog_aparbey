import { Sidebar } from '@/app/components/Sidebar';
import { MainContent } from '@/app/components/MainContent';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-surface-950">
            <Sidebar />
            <MainContent>
                {children}
            </MainContent>
        </div>
    );
}
