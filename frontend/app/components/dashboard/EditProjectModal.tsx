'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { filesService, AnalysisResult } from '@/app/services/filesService';
import { projectsService, Project } from '@/app/services/projectsService';

interface EditProjectModalProps {
    project: Project;
    onClose: () => void;
    onSuccess: (project: Project) => void;
}

export default function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {
    const [activeTab, setActiveTab] = useState<'data' | 'mapping'>('mapping');
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({
        source: '',
        target: '',
        weight: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [columns, setColumns] = useState<string[]>([]);

    // Initialize columns and mapping from project metadata if available
    useEffect(() => {
        if (project.metadata?.columns) {
            setColumns(project.metadata.columns);
        }
        if (project.mapping) {
            setMapping(prev => ({ ...prev, ...project.mapping }));
        }
    }, [project]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const uploadedFile = acceptedFiles[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setIsLoading(true);
        setError(null);

        try {
            const data = await filesService.analyze(uploadedFile);
            
            if (data.type === 'json_object') {
                setError(data.message || 'Format JSON non compatible.');
                setIsLoading(false);
                return;
            }

            setAnalysis(data);
            setColumns(data.columns || []);
            setMapping(prev => ({ ...prev, ...data.suggestions }));
            setActiveTab('mapping'); // Auto switch to mapping
        } catch (err) {
            setError('Erreur lors de l\'analyse du fichier.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
        maxFiles: 1
    });

    const handleUpdate = async () => {
        if (!mapping.source || !mapping.target) {
            setError('Les champs Source et Target sont obligatoires.');
            return;
        }

        setIsLoading(true);
        try {
            const updateData: any = {
                mapping
            };

            if (analysis?.temp_file_id) {
                updateData.temp_file_id = analysis.temp_file_id;
            }

            const updatedProject = await projectsService.update(project.id, updateData);
            onSuccess(updatedProject);
        } catch (err) {
            console.error(err);
            setError("Erreur lors de la mise à jour du projet.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-surface-50/10 mb-6">
                <button
                    onClick={() => setActiveTab('data')}
                    className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === 'data' 
                            ? 'text-blue-400' 
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Données
                    {activeTab === 'data' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('mapping')}
                    className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === 'mapping' 
                            ? 'text-blue-400' 
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Mapping
                    {activeTab === 'mapping' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {error && (
                    <div className="mb-4 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
                        {error}
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="space-y-6">
                        <div
                            {...getRootProps()}
                            className={`
                                group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer
                                ${isDragActive 
                                    ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
                                    : 'border-surface-700 bg-surface-800/30 hover:border-blue-400/50 hover:bg-surface-800/50'
                                }
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className={`
                                mb-6 rounded-2xl p-4 transition-all duration-300
                                ${isDragActive ? 'bg-blue-500 text-white scale-110' : 'bg-surface-800 text-surface-400 group-hover:bg-surface-700 group-hover:text-blue-400'}
                            `}>
                                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="text-lg font-bold text-surface-50">
                                {isDragActive ? "Déposez le fichier ici" : "Glissez-déposez votre fichier"}
                            </p>
                            <p className="mt-2 text-sm text-surface-400">
                                CSV ou JSON (Node-Link)
                            </p>
                        </div>

                        {file && (
                            <div className="flex items-center justify-between rounded-xl bg-surface-800/50 p-4 border border-surface-700">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-lg bg-blue-500/20 p-3 text-blue-400">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-surface-50">{file.name}</p>
                                        <p className="text-xs text-surface-400">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setAnalysis(null); }}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'mapping' && (
                    <div className="space-y-6">
                        {columns.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-surface-800/20 rounded-2xl border border-dashed border-surface-700">
                                <div className="mb-4 inline-flex p-4 rounded-full bg-surface-800 text-surface-500">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-surface-300">Aucune colonne détectée</p>
                                <p className="text-sm mt-2 text-surface-500 max-w-xs mx-auto">Veuillez importer un fichier dans l'onglet "Données" pour configurer le mapping.</p>
                                <button 
                                    onClick={() => setActiveTab('data')}
                                    className="mt-6 px-6 py-2 rounded-lg bg-surface-800 text-blue-400 hover:bg-surface-700 hover:text-blue-300 transition-colors font-medium"
                                >
                                    Aller à l'import
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Source */}
                                <div className="group rounded-xl bg-surface-800/30 p-4 border border-surface-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                                    <div className="flex items-center gap-2 mb-3 text-blue-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        <label className="font-bold text-sm uppercase tracking-wide">Source *</label>
                                    </div>
                                    <select
                                        value={mapping.source}
                                        onChange={(e) => setMapping(prev => ({ ...prev, source: e.target.value }))}
                                        className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors cursor-pointer hover:bg-surface-800"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {columns.map(col => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-surface-500">Identifiant du nœud source</p>
                                </div>

                                {/* Target */}
                                <div className="group rounded-xl bg-surface-800/30 p-4 border border-surface-700 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                                    <div className="flex items-center gap-2 mb-3 text-purple-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                        </svg>
                                        <label className="font-bold text-sm uppercase tracking-wide">Cible *</label>
                                    </div>
                                    <select
                                        value={mapping.target}
                                        onChange={(e) => setMapping(prev => ({ ...prev, target: e.target.value }))}
                                        className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors cursor-pointer hover:bg-surface-800"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {columns.map(col => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-surface-500">Identifiant du nœud cible</p>
                                </div>

                                {/* Weight */}
                                <div className="group rounded-xl bg-surface-800/30 p-4 border border-surface-700 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
                                    <div className="flex items-center gap-2 mb-3 text-green-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                        </svg>
                                        <label className="font-bold text-sm uppercase tracking-wide">Poids</label>
                                    </div>
                                    <select
                                        value={mapping.weight}
                                        onChange={(e) => setMapping(prev => ({ ...prev, weight: e.target.value }))}
                                        className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-50 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors cursor-pointer hover:bg-surface-800"
                                    >
                                        <option value="">Aucun</option>
                                        {columns.map(col => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-surface-500">Force du lien</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-surface-50/10 pt-6">
                <button
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-surface-300 hover:bg-surface-800 hover:text-white transition-colors"
                >
                    Annuler
                </button>
                <button
                    onClick={handleUpdate}
                    disabled={isLoading || (activeTab === 'mapping' && (!mapping.source || !mapping.target))}
                    className={`
                        flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition-all
                        ${isLoading || (activeTab === 'mapping' && (!mapping.source || !mapping.target))
                            ? 'cursor-not-allowed bg-surface-700 opacity-50'
                            : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                        }
                    `}
                >
                    {isLoading ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                            Traitement...
                        </>
                    ) : (
                        'Mettre à jour'
                    )}
                </button>
            </div>
        </div>
    );
}