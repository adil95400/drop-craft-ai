import PlatformImportLayout from '@/components/import/PlatformImportLayout';
import { ShoppingBag, Package, Video, DollarSign, Clock } from 'lucide-react';

const aliExpressConfig = {
  name: 'AliExpress',
  slug: 'aliexpress',
  icon: ShoppingBag,
  color: '#E62E04',
  urlPlaceholder: 'https://www.aliexpress.com/item/1005001234567890.html',
  urlExamples: [
    'https://www.aliexpress.com/item/1005001234567890.html',
    'https://fr.aliexpress.com/item/1005001234567890.html',
  ],
  extractedData: [
    'Titre optimisé', 'Description complète', 'Images HD', 'Vidéos produit',
    'Toutes variantes', 'Prix & stock', 'Specs techniques', 'Avis clients',
    'Info fournisseur',
  ],
  stats: [
    { label: 'Produits', value: '500M+', icon: Package },
    { label: 'Vidéos incluses', value: '100%', icon: Video },
    { label: 'vs retail', value: '-70%', icon: DollarSign },
    { label: 'Import complet', value: '<5s', icon: Clock },
  ],
};

export default function AliExpressImportPage() {
  return <PlatformImportLayout config={aliExpressConfig} />;
}
