import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'watch-import',
  name: 'Watch Import',
  description: 'Grossiste montres et bijoux de qualité',
  website: 'https://www.watch-import.com',
  category: 'wholesaler',
  region: 'Europe',
  features: [
    'Montres de marque',
    'Bijoux',
    'Accessoires luxe',
    'Dropshipping horlogerie'
  ],
  authType: 'credentials',
  authFields: [
    { name: 'Numéro client', key: 'customer_id', type: 'text', placeholder: 'Votre numéro client', required: true },
    { name: 'Mot de passe', key: 'password', type: 'password', placeholder: 'Votre mot de passe', required: true }
  ],
  productCount: '15K+',
  deliveryTime: '2-5 jours',
  pricing: 'Prix grossiste',
  color: '#9c27b0'
}

export default function WatchImportConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
