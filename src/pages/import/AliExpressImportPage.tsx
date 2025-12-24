import { Helmet } from 'react-helmet-async';
import { AliExpressImporter } from '@/components/aliexpress';

export default function AliExpressImportPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Helmet>
        <title>Import AliExpress - ShopOpti</title>
        <meta name="description" content="Importez des produits depuis AliExpress par URL ou recherche" />
      </Helmet>
      
      <AliExpressImporter />
    </div>
  );
}
