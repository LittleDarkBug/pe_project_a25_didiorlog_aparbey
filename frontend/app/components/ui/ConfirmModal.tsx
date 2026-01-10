'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    onConfirm,
    onCancel,
    danger = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-surface-900 border border-surface-50/10 rounded-2xl shadow-2xl animate-scale-in">
                <div className="p-6">
                    {/* Icon */}
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-500/20' : 'bg-yellow-500/20'
                        }`}>
                        <AlertTriangle className={`h-6 w-6 ${danger ? 'text-red-400' : 'text-yellow-400'}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-center text-surface-50 mb-2">
                        {title}
                    </h3>
                    <p className="text-center text-surface-400 mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-xl border border-surface-50/10 text-surface-300 font-medium hover:bg-surface-50/5 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${danger
                                    ? 'bg-red-600 hover:bg-red-500 text-white'
                                    : 'bg-primary-600 hover:bg-primary-500 text-white'
                                }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
