import { SupplierConnectorsHub } from '@/components/suppliers/SupplierConnectorsHub';
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout';
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection';
import { PlugZap, Link2, Zap, Globe } from 'lucide-react';

export default function SupplierConnectorsHubPage() {
  return (
    <ChannablePageLayout
      title="Hub Connecteurs API"
      metaTitle="Connecteurs Fournisseurs"
      metaDescription="Connectez AliExpress, CJ, BigBuy, Spocket et 15+ fournisseurs en quelques clics."
      showBackButton
      backTo="/suppliers"
      backLabel="Retour aux fournisseurs"
    >
      <ChannableHeroSection
        badge={{ label: "API Hub", variant: "default" }}
        title="Hub Connecteurs"
        subtitle="Connectez vos fournisseurs en quelques clics"
        description="Intégrez AliExpress, CJ Dropshipping, BigBuy, Spocket et 15+ fournisseurs avec synchronisation automatique."
        stats={[
          { value: "15+", label: "Connecteurs", icon: PlugZap },
          { value: "API", label: "Sync auto", icon: Zap },
          { value: "24/7", label: "Disponible", icon: Globe },
          { value: "1-click", label: "Setup", icon: Link2 }
        ]}
        variant="compact"
      />
      
      <SupplierConnectorsHub />
    </ChannablePageLayout>
  );
}
