import PlatformImportLayout from '@/components/import/PlatformImportLayout';
import { Gavel, Package, Globe, Zap } from 'lucide-react';

const ebayConfig = {
  name: 'eBay',
  slug: 'ebay',
  icon: Gavel,
  color: '#0064D2',
  urlPlaceholder: 'https://www.ebay.fr/itm/123456789',
  urlExamples: [
    'https://www.ebay.fr/itm/123456789',
    'https://www.ebay.com/itm/123456789',
    'https://www.ebay.co.uk/itm/123456789',
  ],
  extractedData: [
    'Titre & description', 'Images haute qualité', 'Prix & enchères', 'État du produit',
    'Frais de port', 'Caractéristiques', 'Info vendeur', 'Historique ventes',
  ],
  marketplaces: [
    { code: 'FR', name: 'eBay France', domain: 'ebay.fr', flag: '🇫🇷' },
    { code: 'US', name: 'eBay USA', domain: 'ebay.com', flag: '🇺🇸' },
    { code: 'UK', name: 'eBay UK', domain: 'ebay.co.uk', flag: '🇬🇧' },
    { code: 'DE', name: 'eBay Germany', domain: 'ebay.de', flag: '🇩🇪' },
    { code: 'ES', name: 'eBay Spain', domain: 'ebay.es', flag: '🇪🇸' },
    { code: 'IT', name: 'eBay Italy', domain: 'ebay.it', flag: '🇮🇹' },
  ],
  stats: [
    { label: 'Produits', value: '1.9B+', icon: Package },
    { label: 'Pays', value: '190', icon: Globe },
    { label: 'Enchères supportées', value: '100%', icon: Gavel },
    { label: 'Import rapide', value: '<3s', icon: Zap },
  ],
};

export default function EbayImportPage() {
  return <PlatformImportLayout config={ebayConfig} />;
}
