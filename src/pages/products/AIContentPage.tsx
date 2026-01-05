import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AIContentDashboard } from '@/components/ai-content';

export default function AIContentPage() {
  return (
    <>
      <Helmet>
        <title>Génération de contenu IA | DropShipper</title>
        <meta name="description" content="Générez automatiquement des descriptions, titres et contenus SEO avec l'IA" />
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Génération de contenu IA</h1>
          <p className="text-muted-foreground">
            Créez des descriptions, titres et contenus SEO automatiquement avec l'intelligence artificielle
          </p>
        </div>

        <AIContentDashboard />
      </div>
    </>
  );
}
