'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Mail, Lock, ArrowRight, LogIn } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        login.mutate({ email, password });
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-500/20 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md p-8 glass-panel border-surface-50/10">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                        <LogIn className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-surface-50 mb-2">Bienvenue</h1>
                    <p className="text-surface-400">Connectez-vous à votre espace GraphXR</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Email"
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@exemple.com"
                        leftIcon={<Mail className="h-5 w-5" />}
                    />

                    <Input
                        label="Mot de passe"
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<Lock className="h-5 w-5" />}
                    />

                    <Button
                        type="submit"
                        isLoading={login.isPending}
                        className="w-full"
                        size="lg"
                        rightIcon={<ArrowRight className="h-5 w-5" />}
                    >
                        Se connecter
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-surface-400">
                    Pas encore de compte ?{' '}
                    <Link href="/register" className="font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                        Créer un compte
                    </Link>
                </div>
            </Card>
        </div>
    );
}
