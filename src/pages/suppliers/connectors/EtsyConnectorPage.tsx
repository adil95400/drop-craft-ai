/**
 * Page du connecteur Etsy
 * Marketplace artisanat et fait-main
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const etsyConfig: SupplierConnectorConfig = {
  id: 'etsy',
  name: 'Etsy',
  description: 'La marketplace mondiale pour les créateurs, artisans et produits vintage',
  website: 'https://www.etsy.com',
  category: 'marketplace',
  region: 'Mondial',
  features: [
    '90+ millions d\'acheteurs actifs',
    'Niche artisanat & vintage',
    'Communauté engagée',
    'Outils marketing intégrés',
    'Etsy Ads',
    'Protection vendeur',
    'Analytics détaillés',
    'Support international'
  ],
  authType: 'oauth',
  authFields: [
    {
      name: 'API Key',
      key: 'api_key',
      type: 'password',
      placeholder: 'Votre clé API Etsy',
      required: true,
      helpText: 'Créez une app sur developers.etsy.com'
    },
    {
      name: 'Shared Secret',
      key: 'shared_secret',
      type: 'password',
      placeholder: 'Votre Shared Secret',
      required: true
    },
    {
      name: 'Shop ID',
      key: 'shop_id',
      type: 'text',
      placeholder: 'ID de votre boutique',
      required: true
    }
  ],
  documentation: 'https://developers.etsy.com/documentation/',
  pricing: 'Commission 6.5%',
  productCount: '100M+',
  deliveryTime: 'Variable',
  color: '#F56400'
}

export default function EtsyConnectorPage() {
  return <SupplierConnectorTemplate config={etsyConfig} />
}
