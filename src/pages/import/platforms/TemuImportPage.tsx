import PlatformImportLayout from '@/components/import/PlatformImportLayout';
import { Flame, Package, Percent, TrendingUp, Zap } from 'lucide-react';

const temuConfig = {
  name: 'Temu',
  slug: 'temu',
  icon: Flame,
  color: '#FB7701',
  urlPlaceholder: 'https://www.temu.com/product-123456.html',
  urlExamples: [
    'https://www.temu.com/product-123456.html',
    'https://www.temu.com/fr/product-123456.html',
  ],
  extractedData: [
    'Titre & description', 'Images HD', 'Prix & promotions', 'Variantes complètes',
    'Prix barré', 'Qualité vérifiée', 'Stock disponible', 'Catégorie',
  ],
  stats: [
    { label: 'Produits', value: '100M+', icon: Package },
    { label: 'Prix moyen', value: '-70%', icon: Percent },
    { label: 'App shopping', value: '#1', icon: TrendingUp },
    { label: 'Import rapide', value: '<3s', icon: Zap },
  ],
};

export default function TemuImportPage() {
  return <PlatformImportLayout config={temuConfig} />;
}
