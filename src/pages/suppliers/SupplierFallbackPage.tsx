import { SupplierFallbackDashboard } from '@/components/supplier-fallback';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

export default function SupplierFallbackPage() {
    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('fallbackFournisseur.title')}
      description="Basculement automatique vers un fournisseur alternatif en cas de rupture"
      heroImage="suppliers"
      badge={{ label: 'Fallback', icon: Shield }}
    >
      <SupplierFallbackDashboard />
    </ChannablePageWrapper>
  );
}
