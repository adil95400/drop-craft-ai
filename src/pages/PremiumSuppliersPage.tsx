import React from 'react';
import { Helmet } from 'react-helmet-async';
import PremiumSuppliersHub from '@/components/premium/PremiumSuppliersHub';

export default function PremiumSuppliersPage() {
  return (
    <>
      <Helmet>
        <title>Fournisseurs Premium | Dropshipping Platform</title>
        <meta 
          name="description" 
          content="Accédez aux meilleurs fournisseurs premium avec livraison rapide EU/US et produits de qualité supérieure pour votre boutique dropshipping" 
        />
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <PremiumSuppliersHub />
      </div>
    </>
  );
}