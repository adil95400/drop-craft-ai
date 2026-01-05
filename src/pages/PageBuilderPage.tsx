/**
 * Page Builder Dashboard Page
 */
import { Helmet } from 'react-helmet-async';
import { PageBuilderDashboard } from '@/components/page-builder';
import { Layout } from 'lucide-react';

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
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Layout className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Page Builder</h1>
            <p className="text-muted-foreground">
              Créez des landing pages avec le drag-and-drop
            </p>
          </div>
        </div>

        {/* Dashboard */}
        <PageBuilderDashboard />
      </div>
    </>
  );
}
