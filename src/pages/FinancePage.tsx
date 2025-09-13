import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';

export default function FinancePage() {
  return (
    <>
      <Helmet>
        <title>Gestion Financière - Comptabilité</title>
        <meta name="description" content="Gérez vos finances, factures, dépenses et analyses de rentabilité en toute simplicité" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Gestion Financière</h1>
          <p className="text-muted-foreground">
            Pilotez la santé financière de votre entreprise
          </p>
        </div>
        
        <FinanceDashboard />
      </div>
    </>
  );
}