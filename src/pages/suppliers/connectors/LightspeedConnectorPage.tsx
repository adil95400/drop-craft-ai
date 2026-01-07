import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'lightspeed',
  name: 'Lightspeed',
  description: 'Solution e-commerce et POS pour retail et restaurants',
  website: 'https://www.lightspeedhq.com',
  category: 'ecommerce',
  region: 'Monde',
  features: [
    'Import catalogue Lightspeed',
    'Synchronisation POS',
    'Gestion multi-magasins',
    'API REST moderne'
  ],
  authType: 'oauth',
  authFields: [
    { name: 'Client ID', key: 'client_id', type: 'text', placeholder: 'Votre Client ID', required: true },
    { name: 'Client Secret', key: 'client_secret', type: 'password', placeholder: 'Votre Client Secret', required: true },
    { name: 'Account ID', key: 'account_id', type: 'text', placeholder: 'Votre Account ID', required: true }
  ],
  documentation: 'https://developers.lightspeedhq.com/',
  productCount: 'Illimité',
  deliveryTime: 'Variable',
  pricing: 'Sur devis',
  color: '#e4002b'
}

export default function LightspeedConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
