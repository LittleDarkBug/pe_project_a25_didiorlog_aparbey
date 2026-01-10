import { Fragment, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={cn(
                    "w-full max-w-lg transform overflow-hidden rounded-2xl border border-surface-50/10 bg-surface-900 shadow-2xl transition-all animate-in zoom-in-95 duration-200",
                    className
                )}
            >
                <div className="flex items-center justify-between border-b border-surface-50/10 px-6 py-4">
                    <h3 className="text-lg font-bold text-surface-50">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    {children}
                </div>

                {footer && (
                    <div className="flex items-center justify-end gap-3 border-t border-surface-50/10 px-6 py-4 bg-surface-950/30">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
