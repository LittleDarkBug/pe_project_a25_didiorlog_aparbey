import { cn } from '@/app/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border bg-surface-50/5 text-surface-50 shadow-sm backdrop-blur-md border-surface-50/10",
                className
            )}
            {...props}
        />
    );
}
