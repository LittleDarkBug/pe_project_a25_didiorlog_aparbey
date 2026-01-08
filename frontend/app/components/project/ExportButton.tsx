'use client';

import { useState } from 'react';
import { useToastStore } from '@/app/store/useToastStore';

interface ExportButtonProps {
    projectId: string;
    projectName?: string;
}

export default function ExportButton({ projectId, projectName }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const { addToast } = useToastStore();

    const handleExport = async (format: 'json' | 'csv') => {
        setIsExporting(true);
        setIsOpen(false);

        try {
            // Recuperer le token d'authentification
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/projects/${projectId}/export?format=${format}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'export');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName || 'graph'}_export.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            addToast(`Export ${format.toUpperCase()} reussi`, 'success');
        } catch (error: any) {
            console.error('Export error:', error);
            addToast(error.message || 'Erreur lors de l\'export', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className="group relative flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-emerald-500/20 hover:text-white hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Exporter le graphe"
            >
                {isExporting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                )}
                <span className="hidden sm:inline">Export</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-1 space-y-1">
                        <button
                            onClick={() => handleExport('json')}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            JSON
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            CSV
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
