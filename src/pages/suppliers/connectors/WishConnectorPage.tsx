import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'wish',
  name: 'Wish',
  description: 'Marketplace mondiale avec des millions de produits à bas prix',
  website: 'https://www.wish.com',
  category: 'marketplace',
  region: 'Monde',
  features: [
    'Import produits Wish',
    'Suivi des prix',
    'Synchronisation catalogue',
    'Dropshipping mondial'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'Access Token', key: 'access_token', type: 'password', placeholder: 'Votre Access Token Wish', required: true, helpText: 'Disponible dans Wish Merchant Dashboard' }
  ],
  documentation: 'https://merchant.wish.com/documentation',
  productCount: '1M+',
  deliveryTime: '15-45 jours',
  pricing: 'Prix usine',
  color: '#2fb7ec'
}

export default function WishConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
