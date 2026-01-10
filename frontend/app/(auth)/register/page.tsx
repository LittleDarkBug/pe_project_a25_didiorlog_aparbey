'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Mail, Lock, User, ArrowRight, UserPlus } from 'lucide-react';
import { useToastStore } from '@/app/store/useToastStore';

export default function RegisterPage() {
    const { register } = useAuth();
    const { addToast } = useToastStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [requestElite, setRequestElite] = useState(false);
    const [gdprConsent, setGdprConsent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addToast('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        if (!gdprConsent) {
            addToast('Veuillez accepter la politique de confidentialité', 'warning');
            return;
        }

        register.mutate({ email, password, full_name: fullName, request_elite: requestElite });
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
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-surface-50 mb-2">Créer un compte</h1>
                    <p className="text-surface-400">Rejoignez la communauté GraphXR</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Nom complet"
                        id="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jean Dupont"
                        leftIcon={<User className="h-5 w-5" />}
                    />

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
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<Lock className="h-5 w-5" />}
                    />

                    <Input
                        label="Confirmer le mot de passe"
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<Lock className="h-5 w-5" />}
                    />

                    <div className="flex items-start p-4 rounded-lg bg-primary-500/5 border border-primary-500/20">
                        <input
                            id="elite"
                            type="checkbox"
                            checked={requestElite}
                            onChange={(e) => setRequestElite(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-surface-600 bg-surface-950/50 text-primary-500 focus:ring-primary-500"
                        />
                        <div className="ml-3">
                            <label htmlFor="elite" className="block text-sm font-medium text-surface-50">
                                Demander un accès Élite (Sauvegarde permanente)
                            </label>
                            <p className="text-xs text-surface-400 mt-1">
                                Les comptes standards sont temporaires et les projets sont supprimés à la déconnexion.
                                Cochez cette case pour demander un compte permanent (validation administrateur requise).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="gdpr"
                            type="checkbox"
                            checked={gdprConsent}
                            onChange={(e) => setGdprConsent(e.target.checked)}
                            className="h-4 w-4 rounded border-surface-600 bg-surface-950/50 text-primary-500 focus:ring-primary-500"
                        />
                        <label htmlFor="gdpr" className="ml-2 block text-sm text-surface-400">
                            J'accepte la{' '}
                            <Link href="/privacy" className="text-primary-400 hover:text-primary-300">
                                politique de confidentialité
                            </Link>
                        </label>
                    </div>

                    <Button
                        type="submit"
                        isLoading={register.isPending}
                        className="w-full"
                        size="lg"
                        rightIcon={<ArrowRight className="h-5 w-5" />}
                    >
                        S'inscrire
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-surface-400">
                    Déjà un compte ?{' '}
                    <Link href="/login" className="font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                        Se connecter
                    </Link>
                </div>
            </Card>
        </div >
    );
}
