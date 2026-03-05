import PlatformImportLayout from '@/components/import/PlatformImportLayout';
import { ShoppingCart, Package, Globe, Star, Zap, BarChart3 } from 'lucide-react';

const amazonConfig = {
  name: 'Amazon',
  slug: 'amazon',
  icon: ShoppingCart,
  color: '#FF9900',
  urlPlaceholder: 'https://www.amazon.fr/dp/B08N5WRWNW',
  urlExamples: [
    'https://www.amazon.fr/dp/B08N5WRWNW',
    'https://www.amazon.com/dp/B0XXXXXXXXX',
    'https://www.amazon.de/dp/B0XXXXXXXXX',
  ],
  extractedData: [
    'Titre & description', 'Images HD', 'Prix & stock', 'Toutes variantes',
    'Marque & catégorie', 'Avis clients', 'BSR (Best Seller Rank)', 'Dimensions & poids',
  ],
  secondaryId: {
    label: 'ASIN',
    placeholder: 'B08N5WRWNW',
    prefix: 'https://www.{domain}/dp/',
  },
  marketplaces: [
    { code: 'FR', name: 'Amazon France', domain: 'amazon.fr', flag: '🇫🇷' },
    { code: 'US', name: 'Amazon USA', domain: 'amazon.com', flag: '🇺🇸' },
    { code: 'UK', name: 'Amazon UK', domain: 'amazon.co.uk', flag: '🇬🇧' },
    { code: 'DE', name: 'Amazon Germany', domain: 'amazon.de', flag: '🇩🇪' },
    { code: 'ES', name: 'Amazon Spain', domain: 'amazon.es', flag: '🇪🇸' },
    { code: 'IT', name: 'Amazon Italy', domain: 'amazon.it', flag: '🇮🇹' },
  ],
  stats: [
    { label: 'Produits disponibles', value: '350M+', icon: Package },
    { label: 'Marketplaces', value: '6', icon: Globe },
    { label: 'Avis extraits', value: '100%', icon: Star },
    { label: 'Import rapide', value: '<3s', icon: Zap },
  ],
};

export default function AmazonImportPage() {
  return <PlatformImportLayout config={amazonConfig} />;
}
