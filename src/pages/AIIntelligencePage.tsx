import React from 'react';
import { Helmet } from 'react-helmet-async';
import AIIntelligenceHub from '@/components/ai/AIIntelligenceHub';

export default function AIIntelligencePage() {
  return (
    <>
      <Helmet>
        <title>Intelligence IA | Dropshipping Platform</title>
        <meta 
          name="description" 
          content="Prédictions de tendances, pricing dynamique et recommandations de produits gagnants alimentés par l'intelligence artificielle" 
        />
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <AIIntelligenceHub />
      </div>
    </>
  );
}