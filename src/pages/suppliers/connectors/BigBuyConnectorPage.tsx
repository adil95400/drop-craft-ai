/**
 * Page du connecteur BigBuy
 * Grossiste européen #1 - Dropshipping & wholesale
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const bigBuyConfig: SupplierConnectorConfig = {
  id: 'bigbuy',
  name: 'BigBuy',
  description: 'Le plus grand grossiste européen avec 100 000+ produits, livraison rapide EU et dropshipping intégré',
  website: 'https://www.bigbuy.eu',
  category: 'wholesaler',
  region: 'Europe',
  features: [
    'Plus de 100 000 produits disponibles',
    'Livraison depuis l\'Espagne (2-5 jours EU)',
    'Dropshipping avec emballage neutre',
    'API complète pour synchronisation',
    'Retours facilités',
    'Support multilingue',
    'Prix de gros compétitifs',
    'Catalogue actualisé quotidiennement'
  ],
  authType: 'api_key',
  authFields: [
    {
      name: 'Clé API',
      key: 'api_key',
      type: 'password',
      placeholder: 'Entrez votre clé API BigBuy',
      required: true,
      helpText: 'Disponible dans votre espace client BigBuy > API'
    },
    {
      name: 'Email du compte',
      key: 'email',
      type: 'email',
      placeholder: 'votre@email.com',
      required: true
    }
  ],
  documentation: 'https://api.bigbuy.eu/doc/',
  pricing: 'À partir de 69€/mois',
  productCount: '100K+',
  deliveryTime: '2-5 jours (EU)',
  color: '#FF6B00'
}

export default function BigBuyConnectorPage() {
  return <SupplierConnectorTemplate config={bigBuyConfig} />
}
