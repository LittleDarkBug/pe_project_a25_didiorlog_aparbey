'use client';

import Link from 'next/link';
import Hero3D from '@/app/components/webComponents/Hero3D';
import { useAuthStore } from '@/app/store/useAuthStore';
import { Button } from '@/app/components/ui/Button';
import { ArrowRight, LayoutDashboard, LogIn, UserPlus, Database, Box, Glasses } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 selection:bg-primary-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-surface-50/10 bg-surface-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-600"></div>
            <span className="text-xl font-bold tracking-tight">GraphXR</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-surface-300 hover:text-surface-50 transition-colors">
              Fonctionnalités
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="primary" size="sm" rightIcon={<LayoutDashboard className="h-4 w-4" />}>
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex gap-4 items-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-surface-50 hover:text-surface-300 transition-colors"
                >
                  Connexion
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Commencer
                  </Button>
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
          <div className="inline-block rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm font-medium text-primary-400 backdrop-blur-sm mb-8 animate-fade-in-up">
            Nouvelle génération de visualisation
          </div>
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-surface-50 to-surface-400 animate-fade-in-up delay-100">
            Visualisez vos données <br />
            en <span className="text-primary-500">3D Immersive</span>
          </h1>
          <p className="mb-10 text-xl text-surface-400 max-w-2xl mx-auto animate-fade-in-up delay-200">
            Transformez vos graphes complexes en environnements spatiaux interactifs.
            Analysez, explorez et collaborez en Réalité Virtuelle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <Link href="/register">
              <Button size="lg" className="rounded-full px-8" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Créer un compte gratuit
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="rounded-full px-8 backdrop-blur-sm">
                Voir la démo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-surface-950 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Une suite complète d'outils</h2>
            <p className="mt-4 text-surface-400">Tout ce dont vous avez besoin pour comprendre vos données relationnelles.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-surface-50/10 bg-surface-50/5 p-8 transition-all hover:border-primary-500/50 hover:bg-primary-500/5">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Import Flexible</h3>
              <p className="text-surface-400">Importez vos fichiers CSV ou JSON. Notre assistant intelligent détecte automatiquement la structure de vos données.</p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-surface-50/10 bg-surface-50/5 p-8 transition-all hover:border-accent-500/50 hover:bg-accent-500/5">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400">
                <Box className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Spatialisation 3D</h3>
              <p className="text-surface-400">Algorithmes de force-directed layout optimisés (Fruchterman-Reingold, DrL) pour révéler les clusters cachés.</p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-surface-50/10 bg-surface-50/5 p-8 transition-all hover:border-pink-500/50 hover:bg-pink-500/5">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
                <Glasses className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Mode VR Immersif</h3>
              <p className="text-surface-400">Explorez vos graphes de l'intérieur avec WebXR. Compatible Meta Quest, HTC Vive et Apple Vision Pro.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-50/10 bg-surface-950 py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-xl font-bold tracking-tight">GraphXR</span>
            <p className="text-sm text-surface-500 mt-2">© 2025 GraphXR. Tous droits réservés.</p>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy" className="text-sm text-surface-400 hover:text-surface-50">Politique de confidentialité</Link>
            <Link href="/terms" className="text-sm text-surface-400 hover:text-surface-50">Conditions d'utilisation</Link>
            <Link href="/contact" className="text-sm text-surface-400 hover:text-surface-50">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
