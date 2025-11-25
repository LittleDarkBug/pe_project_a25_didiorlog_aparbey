'use client';

import Link from 'next/link';
import Hero3D from '@/app/components/webComponents/Hero3D';
import { useAuthStore } from '@/app/store/useAuthStore';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600"></div>
            <span className="text-xl font-bold tracking-tight">GraphXR</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Fonctionnalités
            </Link>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex gap-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-white hover:text-gray-300 transition-colors py-2"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Commencer
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex h-screen flex-col items-center justify-center overflow-hidden pt-20">
        {/* Background 3D */}
        <div className="absolute inset-0 z-0 opacity-60">
          <Hero3D />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <div className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 backdrop-blur-sm mb-8 animate-fade-in-up">
            Nouvelle génération de visualisation
          </div>
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 animate-fade-in-up delay-100">
            Visualisez vos données <br />
            en <span className="text-blue-500">3D Immersive</span>
          </h1>
          <p className="mb-10 text-xl text-gray-400 max-w-2xl mx-auto animate-fade-in-up delay-200">
            Transformez vos graphes complexes en environnements spatiaux interactifs.
            Analysez, explorez et collaborez en Réalité Virtuelle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition-all hover:scale-105 hover:shadow-xl hover:shadow-white/10"
            >
              Créer un compte gratuit
            </Link>
            <Link
              href="#demo"
              className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              Voir la démo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-black relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Une suite complète d'outils</h2>
            <p className="mt-4 text-gray-400">Tout ce dont vous avez besoin pour comprendre vos données relationnelles.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:border-blue-500/50 hover:bg-blue-500/5">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Import Flexible</h3>
              <p className="text-gray-400">Importez vos fichiers CSV ou JSON. Notre assistant intelligent détecte automatiquement la structure de vos données.</p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:border-purple-500/50 hover:bg-purple-500/5">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Spatialisation 3D</h3>
              <p className="text-gray-400">Algorithmes de force-directed layout optimisés (Fruchterman-Reingold, DrL) pour révéler les clusters cachés.</p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:border-pink-500/50 hover:bg-pink-500/5">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Mode VR Immersif</h3>
              <p className="text-gray-400">Explorez vos graphes de l'intérieur avec WebXR. Compatible Meta Quest, HTC Vive et Apple Vision Pro.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-xl font-bold tracking-tight">GraphXR</span>
            <p className="text-sm text-gray-500 mt-2">© 2025 GraphXR. Tous droits réservés.</p>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">Politique de confidentialité</Link>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white">Conditions d'utilisation</Link>
            <Link href="/contact" className="text-sm text-gray-400 hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
