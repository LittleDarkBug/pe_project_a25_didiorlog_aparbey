'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { projectsService } from '@/app/services/projectsService';
import { Clock, AlertTriangle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function SessionExpirationWarning() {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    // Only for free users
    const isFreeUser = user && !user.is_elite && !user.is_superuser;

    useEffect(() => {
        if (!isFreeUser) return;

        const checkExpiration = async () => {
            try {
                const projects = await projectsService.list();
                if (projects.length === 0) return;

                // Trouver le projet le plus ancien
                const oldestProject = projects.reduce((oldest, current) => {
                    const oldestDate = new Date(oldest.created_at || Date.now());
                    const currentDate = new Date(current.created_at || Date.now());
                    return currentDate < oldestDate ? current : oldest;
                });

                const createdTime = new Date(oldestProject.created_at || Date.now()).getTime();
                const now = Date.now();
                const expirationTime = createdTime + (6 * 60 * 60 * 1000); // 6 hours TTL
                const diff = expirationTime - now;

                if (diff <= 0) {
                    setIsExpired(true);
                    setTimeLeft(0);
                } else {
                    setTimeLeft(diff);

                    // Show warning if less than 30 minutes
                    if (diff < 30 * 60 * 1000) {
                        setShowWarning(true);
                    }
                }
            } catch (error) {
                console.error("Error checking expiration", error);
            }
        };

        checkExpiration();
        const interval = setInterval(checkExpiration, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [isFreeUser]);

    if (!isFreeUser || !timeLeft || timeLeft > 30 * 60 * 1000) return null;

    const minutesLeft = Math.floor(timeLeft / 60000);
    const hours = Math.floor(minutesLeft / 60);
    const mins = minutesLeft % 60;

    return (
        <>
            {/* Warning Banner/Toast */}
            {showWarning && !isExpired && (
                <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
                    <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/50 rounded-xl p-4 shadow-2xl flex items-start gap-3 max-w-sm">
                        <div className="p-2 bg-yellow-500/20 rounded-lg shrink-0">
                            <Clock className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-yellow-500 mb-1">Expiration de Session</h4>
                            <p className="text-sm text-surface-200 mb-2">
                                Vos projets Free expireront dans <span className="font-bold text-white">{hours}h {mins}m</span>.
                                Sauvegardez vos données ou passez Elite pour les conserver.
                            </p>
                            <button
                                onClick={() => setShowWarning(false)}
                                className="text-xs text-yellow-500 hover:text-yellow-400 underline"
                            >
                                Masquer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Critical Expiration Modal (< 5 min) */}
            <ConfirmModal
                isOpen={timeLeft < 5 * 60 * 1000 && !isExpired}
                title="Attention : Suppression Imminente"
                message={`Vos projets seront supprimés définivement dans ${mins} minutes. Sauvegardez votre travail maintenant.`}
                confirmLabel="J'ai compris"
                cancelLabel="Fermer"
                onConfirm={() => { }} // Just close
                onCancel={() => { }}
                danger
            />
        </>
    );
}
