import { Skeleton } from './Skeleton';

export function ProjectSkeleton() {
    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            {/* Top Bar */}
            <div className="absolute left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-black/50 px-4 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                <div className="relative h-full w-full">
                    {/* Simulated Nodes */}
                    <Skeleton className="absolute left-1/4 top-1/3 h-12 w-12 rounded-full opacity-20" />
                    <Skeleton className="absolute left-1/2 top-1/2 h-16 w-16 rounded-full opacity-20" />
                    <Skeleton className="absolute right-1/3 bottom-1/4 h-10 w-10 rounded-full opacity-20" />
                    
                    {/* Simulated Connections (using thin divs) */}
                    <div className="absolute left-[28%] top-[38%] h-[1px] w-[20%] rotate-12 bg-white/5" />
                    <div className="absolute left-[50%] top-[50%] h-[1px] w-[15%] rotate-45 bg-white/5" />
                </div>
            </div>

            {/* Right Sidebar (Details Panel) */}
            <div className="absolute bottom-4 right-4 top-20 z-10 w-80 rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                <Skeleton className="mb-4 h-6 w-32" />
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-black/50 p-2 backdrop-blur-md">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
        </div>
    );
}
