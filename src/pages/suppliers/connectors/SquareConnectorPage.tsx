import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'square',
  name: 'Square',
  description: 'Plateforme de commerce et paiement tout-en-un',
  website: 'https://squareup.com',
  category: 'ecommerce',
  region: 'Monde',
  features: [
    'Import catalogue Square',
    'Synchronisation POS',
    'Gestion des paiements',
    'API complète'
  ],
  authType: 'oauth',
  authFields: [
    { name: 'Application ID', key: 'application_id', type: 'text', placeholder: 'Votre Application ID', required: true },
    { name: 'Access Token', key: 'access_token', type: 'password', placeholder: 'Votre Access Token', required: true }
  ],
  documentation: 'https://developer.squareup.com/docs',
  productCount: 'Illimité',
  deliveryTime: 'Variable',
  pricing: '2.6% + 10¢',
  color: '#006aff'
}

export default function SquareConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
