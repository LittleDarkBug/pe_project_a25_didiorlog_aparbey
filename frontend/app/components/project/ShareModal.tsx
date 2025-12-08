import { useState } from 'react';
import { X, Copy, Check, Globe, Clock } from 'lucide-react';
import { shareService } from '@/app/services/shareService';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
}

export default function ShareModal({ isOpen, onClose, projectId, projectName }: ShareModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [expiresIn, setExpiresIn] = useState(7);

    if (!isOpen) return null;

    const handleGenerateLink = async () => {
        setIsLoading(true);
        try {
            const response = await shareService.generateLink(projectId, expiresIn);
            // Construct full URL
            const origin = window.location.origin;
            setShareLink(`${origin}${response.url}`);
        } catch (error) {
            console.error("Failed to generate link", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-surface-50/10 bg-surface-900 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-surface-50">Partager le projet</h2>
                    <button onClick={onClose} className="text-surface-400 hover:text-surface-50 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl bg-surface-800/30 p-4 border border-surface-700">
                        <div className="flex gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 h-fit">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-surface-50 mb-1">Accès Public</h3>
                                <p className="text-sm text-surface-400">
                                    Toute personne disposant du lien pourra voir "{projectName}" en lecture seule.
                                </p>
                            </div>
                        </div>
                    </div>

                    {!shareLink ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-surface-300 mb-2 uppercase tracking-wide">
                                    Expiration du lien
                                </label>
                                <select 
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                                    className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors cursor-pointer hover:bg-surface-800"
                                >
                                    <option value={1}>1 jour</option>
                                    <option value={7}>7 jours</option>
                                    <option value={30}>30 jours</option>
                                </select>
                            </div>

                            <button
                                onClick={handleGenerateLink}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-all bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Globe className="w-4 h-4" />
                                        Générer le lien de partage
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-surface-300 uppercase tracking-wide">Lien de partage</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={shareLink}
                                        className="flex-1 rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-50 focus:outline-none font-mono"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 font-medium ${
                                            copied 
                                                ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                                : 'bg-surface-800 border-surface-600 text-surface-300 hover:bg-surface-700 hover:text-white'
                                        }`}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-surface-500 bg-surface-800/30 p-2 rounded-lg border border-surface-700/50">
                                <Clock className="w-3 h-3" />
                                Expire dans {expiresIn} jours
                            </div>

                            <button
                                onClick={() => setShareLink(null)}
                                className="w-full text-sm text-surface-400 hover:text-blue-400 transition-colors py-2"
                            >
                                Générer un nouveau lien
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
