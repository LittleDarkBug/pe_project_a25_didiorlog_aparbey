'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import StatsCard from './StatsCard';
import { filesService, AnalysisResult } from '@/app/services/filesService';
import { projectsService } from '@/app/services/projectsService';

interface ImportWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'upload' | 'mapping' | 'details';

export default function ImportWizard({ onClose, onSuccess }: ImportWizardProps) {
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({
        source: '',
        target: '',
        weight: '',
    });
    const [projectName, setProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const uploadedFile = acceptedFiles[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setIsLoading(true);
        setError(null);

        try {
            const data = await filesService.analyze(uploadedFile);
            console.log('Analyse reçue:', data);

            // Vérifier si c'est un format supporté
            if (data.type === 'json_object') {
                setError(data.message || 'Format JSON non compatible. Utilisez CSV ou format node-link (nodes/edges).');
                setIsLoading(false);
                return;
            }

            setAnalysis(data);
            setMapping(prev => ({ ...prev, ...data.suggestions }));
            setStep('mapping');
        } catch (err) {
            setError('Erreur lors de l\'analyse du fichier. Vérifiez le format.');
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

    const handleMappingSubmit = () => {
        if (!mapping.source || !mapping.target) {
            setError('Les champs Source et Target sont obligatoires.');
            return;
        }
        setStep('details');
        setError(null);
    };

    const handleCreateProject = async () => {
        if (!projectName.trim()) {
            setError('Le nom du projet est requis.');
            return;
        }
        if (!analysis?.temp_file_id) {
            setError('Erreur: Fichier manquant.');
            return;
        }

        setIsLoading(true);
        try {
            await projectsService.create({
                name: projectName,
                temp_file_id: analysis.temp_file_id,
                mapping
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError('Erreur lors de la création du projet.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">Nouveau Projet</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-8 flex items-center justify-center gap-4">
                        <div className={`h-2 w-20 rounded-full ${step === 'upload' ? 'bg-blue-500' : 'bg-blue-900'}`} />
                        <div className={`h-2 w-20 rounded-full ${step === 'mapping' ? 'bg-blue-500' : 'bg-gray-800'}`} />
                        <div className={`h-2 w-20 rounded-full ${step === 'details' ? 'bg-blue-500' : 'bg-gray-800'}`} />
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {step === 'upload' && (
                        <div {...getRootProps()} className={`flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}>
                            <input {...getInputProps()} />
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                                    <p className="text-sm text-gray-400">Analyse du fichier...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 rounded-full bg-blue-500/20 p-4 text-blue-400">
                                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium text-white">Glissez votre fichier ici</p>
                                    <p className="mt-1 text-sm text-gray-400">CSV ou JSON acceptés</p>
                                </>
                            )}
                        </div>
                    )}

                    {step === 'mapping' && analysis && (
                        <div className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-400">Nœud Source *</label>
                                    <select value={mapping.source} onChange={(e) => setMapping(prev => ({ ...prev, source: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none">
                                        <option value="">Sélectionner une colonne</option>
                                        {analysis.columns?.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-400">Nœud Cible *</label>
                                    <select value={mapping.target} onChange={(e) => setMapping(prev => ({ ...prev, target: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none">
                                        <option value="">Sélectionner une colonne</option>
                                        {analysis.columns?.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-400">Poids (Optionnel)</label>
                                    <select value={mapping.weight} onChange={(e) => setMapping(prev => ({ ...prev, weight: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none">
                                        <option value="">Aucun</option>
                                        {analysis.columns?.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                            </div>

                            {analysis.stats && <StatsCard stats={analysis.stats} />}

                            <div className="rounded-lg border border-white/10 bg-black/50 overflow-hidden">
                                <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-xs font-medium text-gray-400 uppercase">
                                    Aperçu des données
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-400">
                                        <thead className="text-xs text-gray-300 uppercase bg-white/5">
                                            <tr>
                                                {analysis.columns?.map(col => <th key={col} className="px-4 py-3 whitespace-nowrap">{col}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analysis.preview?.map((row, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                    {analysis.columns?.map(col => (
                                                        <td key={`${i}-${col}`} className="px-4 py-3 whitespace-nowrap">
                                                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button onClick={() => setStep('upload')} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">Retour</button>
                                <button onClick={handleMappingSubmit} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500">Suivant</button>
                            </div>
                        </div>
                    )}

                    {step === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-400">Nom du projet</label>
                                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Mon super graphe" className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none" autoFocus />
                            </div>
                            <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                                <h4 className="mb-2 text-sm font-semibold text-blue-400">Résumé</h4>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    <li>•Fichier : <span className="text-white">{file?.name}</span></li>
                                    <li>• Source : <span className="text-white">{mapping.source}</span></li>
                                    <li>• Cible : <span className="text-white">{mapping.target}</span></li>
                                    <li>• Poids : <span className="text-white">{mapping.weight || 'N/A'}</span></li>
                                </ul>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setStep('mapping')} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">Retour</button>
                                <button onClick={handleCreateProject} disabled={isLoading} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                                    {isLoading ? 'Création...' : 'Créer le projet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
