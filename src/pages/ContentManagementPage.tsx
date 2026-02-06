import { Helmet } from 'react-helmet-async';
import { ContentManagementHub } from '@/components/content-management/ContentManagementHub';
import { PageBanner } from '@/components/shared/PageBanner';
import { FileText } from 'lucide-react';

const ContentManagementPage = () => {
  return (
    <>
      <Helmet>
        <title>Gestion de Contenu - Bibliothèque, Blog & Calendrier</title>
        <meta name="description" content="Gérez votre contenu, articles de blog, calendrier éditorial et templates de contenu" />
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <PageBanner
          icon={FileText}
          title="Gestion de Contenu"
          description="Gérez votre contenu, articles de blog, calendrier éditorial et templates"
          theme="purple"
        />
        <ContentManagementHub />
      </div>
    </>
  );
};

export default ContentManagementPage;
