import { Helmet } from 'react-helmet-async';
import { ContentManagementHub } from '@/components/content-management/ContentManagementHub';

const ContentManagementPage = () => {
  return (
    <>
      <Helmet>
        <title>Gestion de Contenu - Bibliothèque, Blog & Calendrier</title>
        <meta name="description" content="Gérez votre contenu, articles de blog, calendrier éditorial et templates de contenu" />
      </Helmet>
      <div className="container mx-auto p-6">
        <ContentManagementHub />
      </div>
    </>
  );
};

export default ContentManagementPage;
