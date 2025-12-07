'use client';

import { useParams } from 'next/navigation';

export default function ProjectPage() {
    const params = useParams();
    const id = params?.id as string;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Projet: {id}</h1>
            <p>Chargement de l'espace de travail...</p>
        </div>
    );
}
