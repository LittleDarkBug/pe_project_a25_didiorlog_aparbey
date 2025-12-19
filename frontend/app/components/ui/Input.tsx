import { cn } from '@/app/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Input({ className, label, error, leftIcon, rightIcon, id, ...props }: InputProps) {
    return (
        <div className="group w-full">
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-surface-300">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400 transition-colors group-focus-within:text-primary-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={id}
                    className={cn(
                        "block w-full rounded-xl border border-surface-50/10 bg-surface-900/20 py-2.5 text-sm text-surface-50 placeholder-surface-400 backdrop-blur-md transition-all",
                        "hover:border-surface-50/20 hover:bg-surface-900/30",
                        "focus:border-primary-500/50 focus:bg-surface-900/40 focus:outline-none focus:ring-4 focus:ring-primary-500/10",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        leftIcon && "pl-10",
                        rightIcon && "pr-10",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
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
