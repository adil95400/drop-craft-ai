import { ContentGenerationHub } from '@/components/content/ContentGenerationHub';
import { Helmet } from 'react-helmet-async';

export default function ContentGenerationPage() {
  return (
    <>
      <Helmet>
        <title>Génération de Contenu IA - Vidéos, Posts Sociaux & Photos</title>
        <meta name="description" content="Générez automatiquement des vidéos TikTok, posts sociaux, et améliorez vos photos produits avec l'IA" />
      </Helmet>
      <div className="container mx-auto p-6">
        <ContentGenerationHub />
      </div>
    </>
  );
}
