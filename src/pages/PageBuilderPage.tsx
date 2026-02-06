/**
 * Page Builder Dashboard Page
 */
import { Helmet } from 'react-helmet-async';
import { PageBuilderDashboard } from '@/components/page-builder';
import { Layout } from 'lucide-react';
import { PageBanner } from '@/components/shared/PageBanner';

export default function PageBuilderPage() {
  return (
    <>
      <Helmet>
        <title>Page Builder | Shopopti</title>
        <meta 
          name="description" 
          content="Créez des landing pages personnalisées avec notre éditeur drag-and-drop. Templates optimisés pour la conversion." 
        />
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 space-y-6">
        <PageBanner
          icon={Layout}
          title="Page Builder"
          description="Créez des landing pages avec le drag-and-drop"
          theme="purple"
        />
        <PageBuilderDashboard />
      </div>
    </>
  );
}
