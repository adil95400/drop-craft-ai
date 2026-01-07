/**
 * Page du connecteur Cdiscount
 * Marketplace française #1
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const cdiscountConfig: SupplierConnectorConfig = {
  id: 'cdiscount',
  name: 'Cdiscount',
  description: 'La première marketplace française avec 20+ millions de clients actifs',
  website: 'https://www.cdiscount.com',
  category: 'marketplace',
  region: 'France',
  features: [
    '20+ millions de clients',
    'Réseau logistique Cdiscount Fulfillment',
    'Programme vendeur PRO',
    'Visibilité premium',
    'Outils de pricing automatique',
    'Rapports de performance détaillés',
    'Support vendeur dédié',
    'Paiements sécurisés'
  ],
  authType: 'api_key',
  authFields: [
    {
      name: 'Identifiant vendeur',
      key: 'seller_id',
      type: 'text',
      placeholder: 'Votre ID vendeur Cdiscount',
      required: true
    },
    {
      name: 'Token API',
      key: 'api_token',
      type: 'password',
      placeholder: 'Votre token API',
      required: true,
      helpText: 'Disponible dans l\'espace vendeur'
    }
  ],
  documentation: 'https://dev.cdiscount.com/',
  pricing: 'Commission 5-15%',
  productCount: '60M+',
  deliveryTime: '1-5 jours',
  color: '#CD1F25'
}

export default function CdiscountConnectorPage() {
  return <SupplierConnectorTemplate config={cdiscountConfig} />
}
