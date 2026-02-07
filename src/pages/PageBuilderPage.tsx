import { Helmet } from 'react-helmet-async';
import { PageBuilderDashboard } from '@/components/page-builder';
import { Layout } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function PageBuilderPage() {
  return (
    <>
      <Helmet>
        <title>Page Builder | Shopopti</title>
        <meta name="description" content="Créez des landing pages personnalisées avec notre éditeur drag-and-drop. Templates optimisés pour la conversion." />
      </Helmet>
      <ChannablePageWrapper
        title="Page Builder"
        description="Créez des landing pages avec le drag-and-drop"
        heroImage="extensions"
        badge={{ label: 'Builder', icon: Layout }}
      >
        <PageBuilderDashboard />
      </ChannablePageWrapper>
    </>
  );
}
