import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'fnac',
  name: 'Fnac',
  description: 'Marketplace Fnac/Darty - Culture, électronique et électroménager',
  website: 'https://www.fnac.com',
  category: 'marketplace',
  region: 'France',
  features: [
    'Catalogue culture & tech',
    'Import produits',
    'Synchronisation stock',
    'Gestion commandes'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'Partner ID', key: 'partner_id', type: 'text', placeholder: 'Votre Partner ID Fnac', required: true },
    { name: 'Shop ID', key: 'shop_id', type: 'text', placeholder: 'Votre Shop ID', required: true },
    { name: 'API Key', key: 'api_key', type: 'password', placeholder: 'Votre clé API', required: true }
  ],
  documentation: 'https://developer.fnac.com/docs',
  productCount: '500K+',
  deliveryTime: '2-5 jours',
  pricing: 'Premium',
  color: '#e1a400'
}

export default function FnacConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
