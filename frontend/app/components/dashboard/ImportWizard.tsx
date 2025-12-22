'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { projectsService } from '@/app/services/projectsService';
import { filesService, AnalysisResult } from '@/app/services/filesService';
import { useJobPolling } from '@/app/hooks/useJobPolling';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/app/store/useToastStore';

interface ImportWizardProps {
    onClose: () => void;
    onSuccess: (project?: any) => void;
}

type Step = 'upload' | 'mapping' | 'details' | 'review';

export default function ImportWizard({ onClose, onSuccess }: ImportWizardProps) {
    const router = useRouter();
    const { addToast } = useToastStore();

    const [currentStep, setCurrentStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // États pour le workflow asynchrone Celery
    const [jobId, setJobId] = useState<string | null>(null);
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

    const [mapping, setMapping] = useState({
        source: '',
        target: '',
        weight: ''
    });

    const [details, setDetails] = useState({
        name: '',
        description: '',
        isPublic: false
    });

    // Polling du job Celery
    const { status: jobStatus, loading: pollingLoading } = useJobPolling(jobId, {
        onSuccess: async () => {
            if (createdProjectId) {
                try {
                    const project = await projectsService.getById(createdProjectId);
                    addToast('Projet créé avec succès', 'success');
                    onSuccess(project);
                    onClose();
                } catch (err) {
                    addToast('Projet créé mais impossible de charger les données', 'error');
                }
            }
            setIsSubmitting(false);
        },
        onError: (error) => {
            addToast(error || 'Erreur lors du traitement asynchrone', 'error');
            setIsSubmitting(false);
        }
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setDetails(prev => ({ ...prev, name: selectedFile.name.split('.')[0] }));

        // Auto-analyze for CSV
        if (selectedFile.name.endsWith('.csv')) {
            setIsAnalyzing(true);

            try {
                const data = await filesService.analyze(selectedFile);

                setAnalysis(data);

                // Use 'suggestions' from AnalysisResult (not 'suggested_mapping')
                if (data.suggestions) {
                    setMapping({
                        source: data.suggestions.source || '',
                        target: data.suggestions.target || '',
                        weight: data.suggestions.weight || ''
                    });
                    addToast('Mapping suggéré appliqué automatiquement', 'info');
                }

                // Auto-advance if analysis is successful
                setTimeout(() => setCurrentStep('mapping'), 500);
            } catch (error) {
                console.error('Analysis error:', error);
                addToast('Erreur lors de l\'analyse du fichier', 'error');
            } finally {
                setIsAnalyzing(false);
            }
        } else {
            // For JSON/GEXF, skip mapping
            setTimeout(() => setCurrentStep('details'), 500);
        }
    }, [addToast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/json': ['.json'],
            'application/xml': ['.gexf', '.xml']
        },
        maxFiles: 1
    });

    const handleCreate = async () => {
        if (!file) return;
        setIsSubmitting(true);

        try {
            const payload = {
                name: details.name,
                temp_file_id: analysis?.temp_file_id || '',
                mapping: mapping
            };
            const { job_id, project_id } = await projectsService.create(payload);
            setJobId(job_id);
            setCreatedProjectId(project_id);
        } catch (error: any) {
            console.error('Creation error:', error);
            addToast(error.message || 'Erreur lors de la création du projet', 'error');
            setIsSubmitting(false);
        }
    };

    const steps: { id: Step; label: string; icon: any }[] = [
        {
            id: 'upload',
            label: 'Fichier',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            )
        },
        {
            id: 'mapping',
            label: 'Mapping',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            )
        },
        {
            id: 'details',
            label: 'Détails',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            )
        },
        {
            id: 'review',
            label: 'Validation',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    const canProceed = () => {
        switch (currentStep) {
            case 'upload': return !!file;
            case 'mapping': return !file?.name.endsWith('.csv') || (!!mapping.source && !!mapping.target);
            case 'details': return !!details.name;
            default: return true;
        }
    };

    const nextStep = () => {
        const currentIndex = steps.findIndex(s => s.id === currentStep);
        if (currentIndex < steps.length - 1) {
            // Skip mapping for non-CSV
            if (currentStep === 'upload' && !file?.name.endsWith('.csv')) {
                setCurrentStep('details');
            } else {
                setCurrentStep(steps[currentIndex + 1].id);
            }
        }
    };

    const prevStep = () => {
        const currentIndex = steps.findIndex(s => s.id === currentStep);
        if (currentIndex > 0) {
            if (currentStep === 'details' && !file?.name.endsWith('.csv')) {
                setCurrentStep('upload');
            } else {
                setCurrentStep(steps[currentIndex - 1].id);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl overflow-hidden rounded-3xl bg-surface-900 shadow-2xl border border-surface-700 flex flex-col max-h-[90vh]"
            >
                {/* Loader asynchrone */}
                {(isSubmitting || pollingLoading) && jobId && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 rounded-3xl">
                        <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 px-6 py-4 rounded-full mb-4">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span className="font-medium">
                                Création du projet en cours...<br />
                                (Cette opération peut prendre plusieurs minutes selon la taille du graphe)
                            </span>
                        </div>
                        {jobStatus?.status && (
                            <span className="text-surface-400 text-sm">Statut : {jobStatus.status}</span>
                        )}
                    </div>
                )}

                {/* Header */}
                <div className="border-b border-surface-700 bg-surface-800/50 p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-surface-50">Nouveau Projet</h2>
                            <p className="text-surface-400 text-sm mt-1">Importez et configurez vos données de graphe</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-surface-400 hover:bg-surface-700 hover:text-surface-50 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Stepper */}
                    <div className="mt-8 flex items-center justify-between px-4">
                        {steps.map((step, index) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

                            return (
                                <div key={step.id} className="flex flex-col items-center relative z-10">
                                    <div
                                        className={`
                                            flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                                            ${isActive || isCompleted
                                                ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                : 'border-surface-600 bg-surface-800 text-surface-400'
                                            }
                                        `}
                                    >
                                        {isCompleted ? (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : step.icon}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-surface-500'}`}>
                                        {step.label}
                                    </span>

                                    {/* Connector Line */}
                                    {index < steps.length - 1 && (
                                        <div className="absolute left-1/2 top-5 -z-10 h-[2px] w-[calc(100vw/4-2rem)] max-w-[180px] -translate-y-1/2 bg-surface-700">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-500"
                                                style={{ width: isCompleted ? '100%' : '0%' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {currentStep === 'upload' && (
                                <div className="flex h-full flex-col items-center justify-center space-y-6">
                                    <div
                                        {...getRootProps()}
                                        className={`
                                            group relative flex w-full max-w-2xl flex-col items-center justify-center rounded-3xl border-2 border-dashed p-16 transition-all duration-300 cursor-pointer
                                            ${isDragActive
                                                ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                                                : 'border-surface-700 bg-surface-800/30 hover:border-blue-400/50 hover:bg-surface-800/50'
                                            }
                                        `}
                                    >
                                        <input {...getInputProps()} />
                                        <div className={`
                                            mb-6 rounded-2xl p-6 transition-all duration-300 shadow-xl
                                            ${isDragActive ? 'bg-blue-500 text-white scale-110' : 'bg-surface-800 text-surface-400 group-hover:bg-surface-700 group-hover:text-blue-400'}
                                        `}>
                                            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-surface-50 mb-2">
                                            {isDragActive ? "Déposez le fichier ici" : "Glissez-déposez votre fichier"}
                                        </h3>
                                        <p className="text-surface-400 text-center max-w-md">
                                            Supporte les fichiers CSV, JSON et GEXF.
                                            <br />Taille max: 50MB
                                        </p>
                                    </div>

                                    {isAnalyzing && (
                                        <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 px-6 py-3 rounded-full">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            <span className="font-medium">Analyse du fichier en cours...</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentStep === 'mapping' && analysis && (
                                <div className="space-y-8">
                                    <div className="text-center mb-8">
                                        <h3 className="text-xl font-bold text-surface-50">Configuration du Mapping</h3>
                                        <p className="text-surface-400">Associez les colonnes de votre CSV aux propriétés du graphe</p>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-3">
                                        {/* Source Card */}
                                        <div className="group rounded-2xl bg-surface-800/30 p-6 border border-surface-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                                            <div className="flex items-center gap-3 mb-4 text-blue-400">
                                                <div className="p-2 rounded-lg bg-blue-500/10">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                    </svg>
                                                </div>
                                                <label className="font-bold text-lg">Source *</label>
                                            </div>
                                            <select
                                                value={mapping.source}
                                                onChange={(e) => setMapping(prev => ({ ...prev, source: e.target.value }))}
                                                className="w-full rounded-xl border border-surface-600 bg-surface-900 px-4 py-3 text-surface-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors cursor-pointer hover:bg-surface-800"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {analysis.columns.map(col => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                            <p className="mt-3 text-sm text-surface-500">Colonne contenant l'identifiant du nœud de départ</p>
                                        </div>

                                        {/* Target Card */}
                                        <div className="group rounded-2xl bg-surface-800/30 p-6 border border-surface-700 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                                            <div className="flex items-center gap-3 mb-4 text-purple-400">
                                                <div className="p-2 rounded-lg bg-purple-500/10">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                                <label className="font-bold text-lg">Cible *</label>
                                            </div>
                                            <select
                                                value={mapping.target}
                                                onChange={(e) => setMapping(prev => ({ ...prev, target: e.target.value }))}
                                                className="w-full rounded-xl border border-surface-600 bg-surface-900 px-4 py-3 text-surface-50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors cursor-pointer hover:bg-surface-800"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {analysis.columns.map(col => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                            <p className="mt-3 text-sm text-surface-500">Colonne contenant l'identifiant du nœud d'arrivée</p>
                                        </div>

                                        {/* Weight Card */}
                                        <div className="group rounded-2xl bg-surface-800/30 p-6 border border-surface-700 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
                                            <div className="flex items-center gap-3 mb-4 text-green-400">
                                                <div className="p-2 rounded-lg bg-green-500/10">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                                    </svg>
                                                </div>
                                                <label className="font-bold text-lg">Poids</label>
                                            </div>
                                            <select
                                                value={mapping.weight}
                                                onChange={(e) => setMapping(prev => ({ ...prev, weight: e.target.value }))}
                                                className="w-full rounded-xl border border-surface-600 bg-surface-900 px-4 py-3 text-surface-50 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors cursor-pointer hover:bg-surface-800"
                                            >
                                                <option value="">Aucun (Défaut: 1)</option>
                                                {analysis.columns.map(col => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                            <p className="mt-3 text-sm text-surface-500">Colonne définissant la force du lien (optionnel)</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 'details' && (
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-surface-300">Nom du projet</label>
                                        <input
                                            type="text"
                                            value={details.name}
                                            onChange={(e) => setDetails(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full rounded-xl border border-surface-600 bg-surface-900 px-4 py-3 text-surface-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                                            placeholder="Mon Super Graphe"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-surface-300">Description</label>
                                        <textarea
                                            value={details.description}
                                            onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
                                            rows={4}
                                            className="w-full rounded-xl border border-surface-600 bg-surface-900 px-4 py-3 text-surface-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all resize-none"
                                            placeholder="Description optionnelle..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-800/50 border border-surface-700">
                                        <input
                                            type="checkbox"
                                            id="isPublic"
                                            checked={details.isPublic}
                                            onChange={(e) => setDetails(prev => ({ ...prev, isPublic: e.target.checked }))}
                                            className="h-5 w-5 rounded border-surface-600 bg-surface-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-900"
                                        />
                                        <label htmlFor="isPublic" className="text-sm font-medium text-surface-300 cursor-pointer select-none">
                                            Rendre ce projet public (visible par tous les utilisateurs)
                                        </label>
                                    </div>
                                </div>
                            )}

                            {currentStep === 'review' && (
                                <div className="max-w-2xl mx-auto space-y-8">
                                    <div className="bg-surface-800/30 rounded-2xl p-6 border border-surface-700 space-y-4">
                                        <h3 className="text-lg font-bold text-surface-50 mb-4">Récapitulatif</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-surface-500">Fichier</p>
                                                <p className="font-medium text-surface-200">{file?.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-surface-500">Taille</p>
                                                <p className="font-medium text-surface-200">{file ? (file.size / 1024).toFixed(1) + ' KB' : '-'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-surface-500">Nom du projet</p>
                                                <p className="font-medium text-surface-200">{details.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-surface-500">Visibilité</p>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${details.isPublic ? 'bg-green-500/10 text-green-400' : 'bg-surface-700 text-surface-300'}`}>
                                                    {details.isPublic ? 'Public' : 'Privé'}
                                                </span>
                                            </div>
                                        </div>

                                        {file?.name.endsWith('.csv') && (
                                            <div className="mt-6 pt-6 border-t border-surface-700">
                                                <p className="text-sm text-surface-500 mb-3">Mapping configuré</p>
                                                <div className="flex gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                        <span className="text-surface-300">Source: <span className="text-surface-50 font-medium">{mapping.source}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                        <span className="text-surface-300">Cible: <span className="text-surface-50 font-medium">{mapping.target}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-surface-700 bg-surface-800/50 p-6 backdrop-blur-md flex justify-between items-center">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 'upload'}
                        className={`
                            px-6 py-2.5 rounded-xl font-medium transition-all
                            ${currentStep === 'upload'
                                ? 'opacity-0 pointer-events-none'
                                : 'text-surface-400 hover:bg-surface-700 hover:text-surface-50'
                            }
                        `}
                    >
                        Retour
                    </button>

                    {currentStep === 'review' ? (
                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    Créer le projet
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-surface-50 text-surface-900 font-bold hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Suivant
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
