import PlatformImportLayout from '@/components/import/PlatformImportLayout';
import { ShoppingCart, Package, Shield, TrendingUp, Zap } from 'lucide-react';

const cdiscountConfig = {
  name: 'Cdiscount',
  slug: 'cdiscount',
  icon: ShoppingCart,
  color: '#00A0E3',
  urlPlaceholder: 'https://www.cdiscount.com/product-123456.html',
  urlExamples: [
    'https://www.cdiscount.com/product-123456.html',
  ],
  extractedData: [
    'Prix marketplace FR', 'Offres vendeurs', 'Caractéristiques', 'Images produit',
    'Avis clients', 'Options livraison', 'Garantie', 'Promotions',
  ],
  stats: [
    { label: 'Produits', value: '50M+', icon: Package },
    { label: 'E-commerce FR', value: '#2', icon: Shield },
    { label: 'Vendeurs', value: '10K+', icon: TrendingUp },
    { label: 'Import rapide', value: '<3s', icon: Zap },
  ],
};

export default function CdiscountImportPage() {
  return <PlatformImportLayout config={cdiscountConfig} />;
}
