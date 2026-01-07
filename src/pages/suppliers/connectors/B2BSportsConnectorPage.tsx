import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'b2b-sports',
  name: 'B2B Sports Wholesale',
  description: 'Grossiste articles de sport et fitness',
  website: 'https://www.b2bsports-wholesale.com',
  category: 'wholesaler',
  region: 'Europe',
  features: [
    'Articles de sport',
    'Équipement fitness',
    'Prix grossiste',
    'Dropshipping sport'
  ],
  authType: 'credentials',
  authFields: [
    { name: 'Email', key: 'email', type: 'email', placeholder: 'votre@email.com', required: true },
    { name: 'Mot de passe', key: 'password', type: 'password', placeholder: 'Votre mot de passe', required: true }
  ],
  productCount: '20K+',
  deliveryTime: '3-7 jours',
  pricing: 'Prix B2B',
  color: '#4caf50'
}

export default function B2BSportsConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
