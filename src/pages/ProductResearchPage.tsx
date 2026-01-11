import { Helmet } from 'react-helmet-async';
import { ProductResearchScanner } from '@/components/product-research/ProductResearchScanner';

export default function ProductResearchPage() {
  return (
    <>
      <Helmet>
        <title>AI Product Research Scanner - Drop Craft AI</title>
        <meta name="description" content="Découvrez les produits gagnants avec notre scanner AI. Analyse de tendances TikTok, Instagram, score de potentiel et détection de saturation marché." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-[1600px]">
        <ProductResearchScanner />
      </div>
    </>
  );
}
