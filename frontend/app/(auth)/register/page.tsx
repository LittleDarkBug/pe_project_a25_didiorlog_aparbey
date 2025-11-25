'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useToastStore } from '@/app/store/useToastStore';

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading } = useAuthStore();
    const { addToast } = useToastStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

        try {
            await register({ email, password, full_name: fullName });
            addToast('Compte créé avec succès ! Veuillez vous connecter.', 'success');
            router.push('/login');
        } catch (error: any) {
            addToast(error.response?.data?.detail || "Erreur d'inscription", 'error');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-xl border border-white/20">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
                    <p className="mt-2 text-gray-400">Rejoignez la communauté GraphXR</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                            Nom complet
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="Jean Dupont"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="vous@exemple.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                            Confirmer le mot de passe
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex items-start">
                        <div className="flex h-5 items-center">
                            <input
                                id="gdpr"
                                name="gdpr"
                                type="checkbox"
                                required
                                checked={gdprConsent}
                                onChange={(e) => setGdprConsent(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-black/50 border-white/10"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="gdpr" className="font-medium text-gray-300">
                                J'accepte les <Link href="/terms" className="text-blue-400 hover:underline">Conditions d'utilisation</Link> et la <Link href="/privacy" className="text-blue-400 hover:underline">Politique de confidentialité</Link>
                            </label>
                            <p className="text-gray-500">Vos données sont traitées conformément au RGPD.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="mr-2 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Création en cours...
                            </span>
                        ) : (
                            "S'inscrire"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400">
                    Déjà un compte ?{' '}
                    <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                        Se connecter
                    </Link>
                </div>
            </div>
        </div>
    );
}
