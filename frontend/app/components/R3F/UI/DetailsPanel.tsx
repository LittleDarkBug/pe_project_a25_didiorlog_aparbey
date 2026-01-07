'use client';

interface DetailsPanelProps {
    data: any;
    type: 'node' | 'edge' | null;
    onClose: () => void;
}

export default function DetailsPanel({ data, type, onClose }: DetailsPanelProps) {
    if (!data || !type) return null;

    // Filter technical properties
    const displayEntries = Object.entries(data).filter(
        ([key]) => !['x', 'y', 'z', 'fx', 'fy', 'fz', '__index', 'geometryId', 'vx', 'vy', 'vz'].includes(key)
    );

    return (
        <div
            className="fixed z-50 w-80 flex flex-col max-h-[60vh] animate-slide-up rounded-xl border border-surface-50/10 bg-surface-950/95 backdrop-blur-xl shadow-2xl"
            style={{ right: '2rem', bottom: '6rem', left: 'auto', top: 'auto' }}
        >
            <div className="flex items-center justify-between p-4 border-b border-surface-50/10 bg-surface-950/95 rounded-t-xl shrink-0">
                <h3 className={`text-lg font-bold ${type === 'node' ? 'text-blue-400' : 'text-purple-400'}`}>
                    {type === 'node' ? 'Détails du Nœud' : 'Détails du Lien'}
                </h3>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-surface-400 hover:bg-surface-50/10 hover:text-surface-50 cursor-pointer transition-colors"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {displayEntries.map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-surface-50/5 p-3">
                        <div className="text-xs font-medium uppercase tracking-wider text-surface-400 mb-1">
                            {key}
                        </div>
                        <div className="text-sm text-surface-50 font-medium break-words">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
