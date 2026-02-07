import { Helmet } from 'react-helmet-async';
import { ContentManagementHub } from '@/components/content-management/ContentManagementHub';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { FileText } from 'lucide-react';

const ContentManagementPage = () => {
  return (
    <>
      <Helmet>
        <title>Gestion de Contenu - Bibliothèque, Blog & Calendrier</title>
        <meta name="description" content="Gérez votre contenu, articles de blog, calendrier éditorial et templates de contenu" />
      </Helmet>
      <ChannablePageWrapper
        title="Gestion de Contenu"
        description="Gérez votre contenu, articles de blog, calendrier éditorial et templates"
        heroImage="marketing"
        badge={{ label: 'Contenu', icon: FileText }}
      >
        <ContentManagementHub />
      </ChannablePageWrapper>
    </>
  );
};

export default ContentManagementPage;
