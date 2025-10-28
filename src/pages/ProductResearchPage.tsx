import { Helmet } from 'react-helmet-async';
import { ProductResearchScanner } from '@/components/product-research/ProductResearchScanner';

export default function ProductResearchPage() {
  return (
    <>
      <Helmet>
        <title>AI Product Research Scanner - Drop Craft AI</title>
        <meta name="description" content="Découvrez les produits gagnants avec notre scanner AI. Analyse de tendances TikTok, Instagram, score de potentiel et détection de saturation marché." />
      </Helmet>
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            🤖 AI Product Research Scanner
          </h1>
          <p className="text-xl text-muted-foreground">
            Trouvez les produits gagnants avant vos concurrents avec notre intelligence artificielle
          </p>
        </div>

        <ProductResearchScanner />
      </div>
    </>
  );
}
