import { useEffect, useRef, useState } from 'react';
import { projectsService, TaskStatus } from '@/app/services/projectsService';

export function useJobPolling(jobId: string | null, options?: { interval?: number, onSuccess?: (result: any) => void, onError?: (error: string) => void }) {
    const [status, setStatus] = useState<TaskStatus | null>(null);
    const [loading, setLoading] = useState(!!jobId);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!jobId) return;
        setLoading(true);
        let stopped = false;

        const poll = async () => {
            try {
                const res = await projectsService.getTaskStatus(jobId);
                setStatus(res);
                if (res.status === 'SUCCESS') {
                    setLoading(false);
                    options?.onSuccess?.(res.result);
                    stopped = true;
                } else if (res.status === 'FAILURE') {
                    setLoading(false);
                    options?.onError?.(res.error || 'Erreur inconnue');
                    stopped = true;
                }
            } catch (err: any) {
                setLoading(false);
                options?.onError?.(err.message || 'Erreur réseau');
                stopped = true;
            }
        };

        poll();
        intervalRef.current = setInterval(() => {
            if (!stopped) poll();
        }, options?.interval || 2000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [jobId]);

    return { status, loading };
}
