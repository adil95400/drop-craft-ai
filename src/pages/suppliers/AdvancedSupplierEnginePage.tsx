/**
 * Page Moteur Fournisseur Avancé
 * Accessible via /suppliers/engine
 */

import { AdvancedSupplierEngine } from '@/components/suppliers/AdvancedSupplierEngine';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Cpu } from 'lucide-react';

export default function AdvancedSupplierEnginePage() {
  return (
    <ChannablePageWrapper
      title="Moteur Fournisseur Avancé"
      subtitle="Le plus puissant du marché e-commerce"
      description="Plus flexible qu'AutoDS, plus qualitatif que Spocket. Automatisation intelligente et sourcing optimisé."
      heroImage="suppliers"
      badge={{ label: "Pro Engine", icon: Cpu }}
    >
      <AdvancedSupplierEngine />
    </ChannablePageWrapper>
  );
}
