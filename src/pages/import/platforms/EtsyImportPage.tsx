import PlatformImportLayout from '@/components/import/PlatformImportLayout';
import { Sparkles, Package, Heart, Zap } from 'lucide-react';

const etsyConfig = {
  name: 'Etsy',
  slug: 'etsy',
  icon: Sparkles,
  color: '#F1641E',
  urlPlaceholder: 'https://www.etsy.com/listing/123456789',
  urlExamples: [
    'https://www.etsy.com/listing/123456789/product-name',
    'https://www.etsy.com/fr/listing/123456789',
  ],
  extractedData: [
    'Titre & description', 'Images artisan', 'Personnalisation', 'Options variantes',
    'Prix & frais', 'Délais fabrication', 'Info artisan', 'Avis clients',
  ],
  stats: [
    { label: 'Produits uniques', value: '100M+', icon: Package },
    { label: 'Artisans actifs', value: '7.5M', icon: Sparkles },
    { label: 'Fait main', value: '100%', icon: Heart },
    { label: 'Import rapide', value: '<3s', icon: Zap },
  ],
};

export default function EtsyImportPage() {
  return <PlatformImportLayout config={etsyConfig} />;
}
