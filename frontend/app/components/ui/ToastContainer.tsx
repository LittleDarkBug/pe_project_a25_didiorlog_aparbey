'use client';

import { useToastStore, ToastType } from '@/app/store/useToastStore';
import { useEffect, useState } from 'react';

/**
 * Composant pour afficher les notifications Toast.
 * Doit être placé dans le layout racine.
 */
export default function ToastContainer() {
    const { toasts, removeToast } = useToastStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
            min-w-[300px] rounded-lg p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full
            ${getToastStyles(toast.type)}
          `}
                    role="alert"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-4 text-current opacity-70 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getToastStyles(type: ToastType): string {
    switch (type) {
        case 'success':
            return 'bg-green-500 text-white';
        case 'error':
            return 'bg-red-500 text-white';
        case 'warning':
            return 'bg-yellow-500 text-white';
        case 'info':
            return 'bg-blue-500 text-white';
        default:
            return 'bg-gray-800 text-white';
    }
}
