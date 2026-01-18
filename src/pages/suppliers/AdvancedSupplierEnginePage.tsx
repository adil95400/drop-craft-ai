/**
 * Page Moteur Fournisseur Avancé
 * Accessible via /suppliers/engine
 */

import { AdvancedSupplierEngine } from '@/components/suppliers/AdvancedSupplierEngine';
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout';
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection';
import { Cpu, Zap, TrendingUp, Settings } from 'lucide-react';

export default function AdvancedSupplierEnginePage() {
  return (
    <ChannablePageLayout
      title="Moteur Fournisseur Avancé"
      metaTitle="Moteur Fournisseur Avancé"
      metaDescription="Le moteur fournisseur le plus avancé du marché e-commerce. Plus flexible qu'AutoDS, plus qualitatif que Spocket."
      showBackButton
      backTo="/suppliers"
      backLabel="Retour aux fournisseurs"
    >
      <ChannableHeroSection
        badge={{ label: "Pro Engine", variant: "default" }}
        title="Moteur Avancé"
        subtitle="Le plus puissant du marché e-commerce"
        description="Plus flexible qu'AutoDS, plus qualitatif que Spocket. Automatisation intelligente et sourcing optimisé."
        stats={[
          { value: "IA", label: "Sourcing", icon: Cpu },
          { value: "Auto", label: "Pricing", icon: Zap },
          { value: "+40%", label: "Marge", icon: TrendingUp },
          { value: "Smart", label: "Rules", icon: Settings }
        ]}
        variant="compact"
      />
      
      <AdvancedSupplierEngine />
    </ChannablePageLayout>
  );
}
