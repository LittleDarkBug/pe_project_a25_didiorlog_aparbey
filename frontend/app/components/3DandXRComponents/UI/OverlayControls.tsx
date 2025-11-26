'use client';

interface OverlayControlsProps {
    onResetCamera: () => void;
    onToggleVR: () => void;
    onShare: () => void;
}

export default function OverlayControls({ onResetCamera, onToggleVR, onShare }: OverlayControlsProps) {
    return (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 transform gap-2 rounded-2xl border border-white/10 bg-black/40 p-2 backdrop-blur-2xl shadow-2xl">
            <button
                onClick={onResetCamera}
                className="group relative flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-blue-500/20 hover:text-white hover:scale-105 cursor-pointer"
                title="Réinitialiser la vue"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Reset</span>
            </button>

            <div className="w-px bg-white/10"></div>

            <button
                onClick={onToggleVR}
                className="group relative flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-purple-500/20 hover:text-white hover:scale-105 cursor-pointer"
                title="Mode VR Immersif"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">VR</span>
            </button>

            <div className="w-px bg-white/10"></div>

            <button
                onClick={onShare}
                className="group relative flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-green-500/20 hover:text-white hover:scale-105 cursor-pointer"
                title="Partager"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">Partager</span>
            </button>
        </div>
    );
}
