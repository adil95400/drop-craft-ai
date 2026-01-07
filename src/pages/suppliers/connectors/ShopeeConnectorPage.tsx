import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'shopee',
  name: 'Shopee',
  description: 'Marketplace leader en Asie du Sud-Est et Amérique Latine',
  website: 'https://shopee.com',
  category: 'marketplace',
  region: 'Asie-Pacifique',
  features: [
    'Import produits Shopee',
    'Synchronisation des prix',
    'Gestion multi-pays',
    'Fulfillment intégré'
  ],
  authType: 'oauth',
  authFields: [
    { name: 'Partner ID', key: 'partner_id', type: 'text', placeholder: 'Votre Partner ID', required: true },
    { name: 'Partner Key', key: 'partner_key', type: 'password', placeholder: 'Votre Partner Key', required: true }
  ],
  documentation: 'https://open.shopee.com/documents',
  productCount: '10M+',
  deliveryTime: '7-21 jours',
  pricing: 'Variable',
  color: '#ee4d2d'
}

export default function ShopeeConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
