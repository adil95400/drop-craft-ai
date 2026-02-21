import { SupplierFallbackDashboard } from '@/components/supplier-fallback';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Shield } from 'lucide-react';

export default function SupplierFallbackPage() {
  return (
    <ChannablePageWrapper
      title="Fallback Fournisseur"
      description="Basculement automatique vers un fournisseur alternatif en cas de rupture"
      heroImage="suppliers"
      badge={{ label: 'Fallback', icon: Shield }}
    >
      <SupplierFallbackDashboard />
    </ChannablePageWrapper>
  );
}
