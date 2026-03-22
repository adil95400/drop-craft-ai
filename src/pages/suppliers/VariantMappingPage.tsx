/**
 * Variant Mapping Page
 */
import { Helmet } from 'react-helmet-async';
import { VariantMappingDashboard } from '@/components/variant-mapping';
import { Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function VariantMappingPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <>
      <Helmet>
        <title>Variant Mapping | Shopopti</title>
        <meta name="description" content="Gérez les mappings de variantes entre vos fournisseurs et votre catalogue." />
      </Helmet>
      
      <ChannablePageWrapper
        title={tPages('variantMapping.title')}
        description="Mappez les variantes fournisseurs vers votre catalogue"
        heroImage="products"
        badge={{ label: 'Variantes', icon: Layers }}
      >
        <VariantMappingDashboard />
      </ChannablePageWrapper>
    </>
  );
}
