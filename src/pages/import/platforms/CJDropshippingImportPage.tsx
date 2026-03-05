import PlatformImportLayout from '@/components/import/PlatformImportLayout';
import { Warehouse, Package, Truck, Globe } from 'lucide-react';

const cjConfig = {
  name: 'CJ Dropshipping',
  slug: 'cj-dropshipping',
  icon: Warehouse,
  color: '#1B6AE5',
  urlPlaceholder: 'https://cjdropshipping.com/product-p-123456.html',
  urlExamples: [
    'https://cjdropshipping.com/product-p-123456.html',
  ],
  extractedData: [
    'Prix fournisseur', 'Stock temps réel', 'Délais livraison', 'Coûts shipping',
    'Images HD', 'Variantes', 'Poids & dimensions', 'SKU CJ',
  ],
  secondaryId: {
    label: 'SKU CJ',
    placeholder: 'CJ123456789',
    prefix: 'https://cjdropshipping.com/product-p-',
  },
  stats: [
    { label: 'Produits', value: '400K+', icon: Package },
    { label: 'Entrepôts', value: '200+', icon: Warehouse },
    { label: 'Livraison EU', value: '3-7j', icon: Truck },
    { label: 'Pays livrés', value: '200+', icon: Globe },
  ],
};

export default function CJDropshippingImportPage() {
  return <PlatformImportLayout config={cjConfig} />;
}
