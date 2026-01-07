/**
 * Page du connecteur Rakuten
 * Marketplace Rakuten France (ex-PriceMinister)
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const rakutenConfig: SupplierConnectorConfig = {
  id: 'rakuten',
  name: 'Rakuten',
  description: 'La marketplace multi-catégories avec programme de fidélité Super Points',
  website: 'https://fr.shopping.rakuten.com',
  category: 'marketplace',
  region: 'France',
  features: [
    'Programme Super Points fidélité',
    'Base clients fidèle',
    'Multi-catégories',
    'Club R premium',
    'Outils de promotion',
    'Analytics détaillés',
    'Support vendeur',
    'Paiement sécurisé'
  ],
  authType: 'api_key',
  authFields: [
    {
      name: 'Login vendeur',
      key: 'login',
      type: 'text',
      placeholder: 'Votre login Rakuten',
      required: true
    },
    {
      name: 'Token API',
      key: 'api_token',
      type: 'password',
      placeholder: 'Votre token API',
      required: true,
      helpText: 'Générez-le dans l\'espace vendeur'
    }
  ],
  documentation: 'https://developer.shopping.rakuten.fr/',
  pricing: 'Commission 8-15%',
  productCount: '200M+',
  deliveryTime: '2-7 jours',
  color: '#BF0000'
}

export default function RakutenConnectorPage() {
  return <SupplierConnectorTemplate config={rakutenConfig} />
}
