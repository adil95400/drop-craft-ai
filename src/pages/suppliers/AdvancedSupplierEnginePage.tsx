/**
 * Page Moteur Fournisseur Avancé
 * Accessible via /suppliers/engine
 */

import { AdvancedSupplierEngine } from '@/components/suppliers/AdvancedSupplierEngine';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Cpu } from 'lucide-react';

export default function AdvancedSupplierEnginePage() {
    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('moteurFournisseurAvance.title')}
      subtitle="Le plus puissant du marché e-commerce"
      description="Plus flexible qu'AutoDS, plus qualitatif que Spocket. Automatisation intelligente et sourcing optimisé."
      heroImage="suppliers"
      badge={{ label: "Pro Engine", icon: Cpu }}
    >
      <AdvancedSupplierEngine />
    </ChannablePageWrapper>
  );
}
