/**
 * Page Moteur Fournisseur Avancé
 * Accessible via /suppliers/engine
 */

import { Helmet } from 'react-helmet-async';
import { AdvancedSupplierEngine } from '@/components/suppliers/AdvancedSupplierEngine';

export default function AdvancedSupplierEnginePage() {
  return (
    <>
      <Helmet>
        <title>Moteur Fournisseur Avancé | Shopopti+</title>
        <meta 
          name="description" 
          content="Le moteur fournisseur le plus avancé du marché e-commerce. Plus flexible qu'AutoDS, plus qualitatif que Spocket." 
        />
      </Helmet>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <AdvancedSupplierEngine />
      </div>
    </>
  );
}
