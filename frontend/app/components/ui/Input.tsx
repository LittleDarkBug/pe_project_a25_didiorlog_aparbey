import { cn } from '@/app/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Input({ className, label, error, leftIcon, rightIcon, id, ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-surface-300">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={id}
                    className={cn(
                        "block w-full rounded-lg border border-surface-50/10 bg-surface-50/5 py-2.5 text-surface-50 placeholder-surface-500 backdrop-blur-sm transition-all focus:border-primary-500 focus:bg-surface-50/10 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50",
                        leftIcon && "pl-10",
                        rightIcon && "pr-10",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                />
                {rightIcon && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
