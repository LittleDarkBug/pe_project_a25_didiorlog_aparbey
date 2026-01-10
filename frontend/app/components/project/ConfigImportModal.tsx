'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileJson, Check, AlertTriangle, X } from 'lucide-react';
import { useToastStore } from '@/app/store/useToastStore';

interface ConfigImportModalProps {
    onClose: () => void;
    onApply: (config: any) => void;
}

export default function ConfigImportModal({ onClose, onApply }: ConfigImportModalProps) {
    const { addToast } = useToastStore();
    const [file, setFile] = useState<File | null>(null);
    const [parsedConfig, setParsedConfig] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Selection State
    const [importFilters, setImportFilters] = useState(true);
    const [importLayout, setImportLayout] = useState(true);
    const [importLabels, setImportLabels] = useState(true);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        try {
            const text = await selectedFile.text();
            const data = JSON.parse(text);

            if (!data.settings) {
                throw new Error("Format invalide: 'settings' manquant.");
            }

            setParsedConfig(data.settings);
            addToast("Fichier analysé avec succès", "success");
        } catch (err) {
            console.error(err);
            setError("Impossible de lire le fichier JSON.");
            setParsedConfig(null);
        }
    }, [addToast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/json': ['.json'] },
        maxFiles: 1
    });

    const handleApply = () => {
        if (!parsedConfig) return;

        const configToApply: any = {};

        if (importFilters && parsedConfig.filters) {
            configToApply.filters = parsedConfig.filters;
        }
        if (importLayout && parsedConfig.layout) {
            configToApply.layout = parsedConfig.layout;
        }
        if (importLabels && typeof parsedConfig.labels !== 'undefined') {
            configToApply.labels = parsedConfig.labels;
        }

        onApply(configToApply);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-900 border border-surface-700 shadow-2xl flex flex-col">
                <div className="p-6 border-b border-surface-700 bg-surface-800/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Importer une Configuration</h2>
                        <p className="text-sm text-surface-400">Appliquez des vues sauvegardées à ce projet</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-700 text-surface-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {!parsedConfig ? (
                        <div
                            {...getRootProps()}
                            className={`
                                group flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all
                                ${isDragActive
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-surface-600 hover:border-blue-400 hover:bg-surface-800/50'
                                }
                                ${error ? 'border-red-500/50 bg-red-500/5' : ''}
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className={`mb-4 rounded-full p-4 shadow-lg transition-transform group-hover:scale-110 ${isDragActive ? 'bg-blue-500 text-white' : 'bg-surface-800 text-surface-400'}`}>
                                <Upload className="h-8 w-8" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-white">
                                {isDragActive ? "Déposez le fichier ici" : "Cliquez ou glissez un fichier JSON"}
                            </h3>
                            <p className="text-sm text-surface-400">
                                Configuration exportée depuis l'application
                            </p>
                            {error && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                                    <AlertTriangle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                                <FileJson className="h-6 w-6 text-green-400" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-medium text-green-400 truncate">{file?.name}</p>
                                    <p className="text-xs text-green-500/70">Configuration valide détectée</p>
                                </div>
                                <button onClick={() => { setFile(null); setParsedConfig(null); }} className="text-sm text-surface-400 hover:text-white underline">
                                    Changer
                                </button>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-surface-300 uppercase tracking-wider">Éléments à importer</h3>

                                {/* Filters Checkbox */}
                                <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${importFilters ? 'bg-blue-500/10 border-blue-500/50' : 'bg-surface-800/30 border-surface-700 hover:bg-surface-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${importFilters ? 'bg-blue-500 border-blue-500' : 'border-surface-500'}`}>
                                            {importFilters && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div>
                                            <span className={`font-medium ${importFilters ? 'text-white' : 'text-surface-400'}`}>Filtres</span>
                                            <p className="text-xs text-surface-500">
                                                {parsedConfig.filters
                                                    ? `${parsedConfig.filters.nodes?.length || 0} nœuds, ${parsedConfig.filters.edges?.length || 0} liens masqués`
                                                    : "Aucun filtre détecté"}
                                            </p>
                                        </div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={importFilters} onChange={() => setImportFilters(!importFilters)} disabled={!parsedConfig.filters} />
                                </label>

                                {/* Layout Checkbox */}
                                <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${importLayout ? 'bg-purple-500/10 border-purple-500/50' : 'bg-surface-800/30 border-surface-700 hover:bg-surface-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${importLayout ? 'bg-purple-500 border-purple-500' : 'border-surface-500'}`}>
                                            {importLayout && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div>
                                            <span className={`font-medium ${importLayout ? 'text-white' : 'text-surface-400'}`}>Algorithme de Layout</span>
                                            <p className="text-xs text-surface-500">
                                                {parsedConfig.layout ? `Algorithme : ${parsedConfig.layout}` : "Aucun layout détecté"}
                                            </p>
                                        </div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={importLayout} onChange={() => setImportLayout(!importLayout)} disabled={!parsedConfig.layout} />
                                </label>

                                {/* Labels Checkbox */}
                                <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${importLabels ? 'bg-orange-500/10 border-orange-500/50' : 'bg-surface-800/30 border-surface-700 hover:bg-surface-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${importLabels ? 'bg-orange-500 border-orange-500' : 'border-surface-500'}`}>
                                            {importLabels && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div>
                                            <span className={`font-medium ${importLabels ? 'text-white' : 'text-surface-400'}`}>Visibilité des Labels</span>
                                            <p className="text-xs text-surface-500">
                                                {parsedConfig.labels !== undefined ? `Labels ${parsedConfig.labels ? 'activés' : 'désactivés'}` : "Non spécifié"}
                                            </p>
                                        </div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={importLabels} onChange={() => setImportLabels(!importLabels)} disabled={parsedConfig.labels === undefined} />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-surface-700 bg-surface-800/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!parsedConfig || (!importFilters && !importLayout && !importLabels)}
                        className={`
                            px-6 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-lg
                            ${!parsedConfig || (!importFilters && !importLayout && !importLabels)
                                ? 'bg-surface-700 text-surface-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                            }
                        `}
                    >
                        Appliquer la Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
