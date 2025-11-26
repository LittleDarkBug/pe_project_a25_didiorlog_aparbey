'use client';

interface DetailsPanelProps {
    data: any;
    type: 'node' | 'edge' | null;
    onClose: () => void;
    mouseX?: number;
    mouseY?: number;
}

export default function DetailsPanel({ data, type, onClose, mouseX, mouseY }: DetailsPanelProps) {
    if (!data || !type) return null;

    const calculatePosition = () => {
        if (mouseX === undefined || mouseY === undefined) {
            return { left: 'auto', right: '1rem', bottom: '6rem', top: 'auto' };
        }

        const offsetX = 20;
        const offsetY = 20;
        const panelWidth = 320;
        const panelHeight = 400;

        let left = mouseX + offsetX;
        let top = mouseY + offsetY;

        if (left + panelWidth > window.innerWidth) {
            left = mouseX - panelWidth - offsetX;
        }

        if (top + panelHeight > window.innerHeight) {
            top = window.innerHeight - panelHeight - 20;
        }

        if (left < 20) left = 20;
        if (top < 20) top = 20;

        return { left: `${left}px`, top: `${top}px`, right: 'auto', bottom: 'auto' };
    };

    const position = calculatePosition();

    return (
        <div
            className="fixed z-50 w-80 max-h-[80vh] overflow-y-auto animate-fade-in rounded-xl border border-white/10 bg-black/90 p-6 backdrop-blur-xl shadow-2xl"
            style={position}
        >
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-black/90 pb-2">
                <h3 className="text-lg font-bold text-white">
                    {type === 'node' ? 'Détails du Nœud' : 'Détails du Lien'}
                </h3>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-400">Identifiant</p>
                    <p className="font-mono text-white break-words">{data.id || 'N/A'}</p>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-300">Propriétés</p>
                    {Object.entries(data).map(([key, value]) => {
                        if (['id', 'x', 'y', 'z', 'source', 'target'].includes(key)) return null;

                        // Try to parse JSON strings
                        let parsedValue = value;
                        if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                            try {
                                parsedValue = JSON.parse(value);
                            } catch (e) {
                                parsedValue = value;
                            }
                        }

                        // Handle nested objects
                        if (typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)) {
                            return (
                                <div key={key} className="space-y-2">
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                        <span className="inline-block w-1 h-4 bg-blue-400 rounded"></span>
                                        {key}
                                    </p>
                                    <div className="ml-3 space-y-1.5 border-l-2 border-blue-500/30 pl-3">
                                        {Object.entries(parsedValue).map(([nestedKey, nestedValue]) => (
                                            <div key={`${key}.${nestedKey}`} className="text-sm">
                                                <span className="text-gray-400">{nestedKey}:</span>{' '}
                                                <span className="text-white font-medium">
                                                    {typeof nestedValue === 'object'
                                                        ? JSON.stringify(nestedValue)
                                                        : String(nestedValue)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        // Handle arrays
                        if (Array.isArray(parsedValue)) {
                            return (
                                <div key={key} className="space-y-2">
                                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                        <span className="inline-block w-1 h-4 bg-purple-400 rounded"></span>
                                        {key}
                                    </p>
                                    <div className="ml-3 space-y-1">
                                        {parsedValue.map((item, idx) => (
                                            <div key={`${key}.${idx}`} className="text-sm text-gray-300">
                                                • {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        // Simple values
                        const displayValue = (parsedValue === null || parsedValue === undefined) ? 'N/A' : String(parsedValue);

                        return (
                            <div key={key} className="flex justify-between gap-2 py-2 border-b border-white/5 text-sm">
                                <span className="text-gray-400 font-medium min-w-[80px]">{key}:</span>
                                <span className="text-white text-right break-words flex-1" title={displayValue}>
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {type === 'edge' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-3">
                            <p className="text-xs text-blue-400 font-semibold mb-1">Source</p>
                            <p className="text-sm text-white font-mono break-words">{data.source}</p>
                        </div>
                        <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-3">
                            <p className="text-xs text-green-400 font-semibold mb-1">Cible</p>
                            <p className="text-sm text-white font-mono break-words">{data.target}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
