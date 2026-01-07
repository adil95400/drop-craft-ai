import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'bts',
  name: 'BTS Wholesaler',
  description: 'Grossiste européen mode, accessoires et bijoux',
  website: 'https://www.bts-wholesaler.com',
  category: 'wholesaler',
  region: 'Europe',
  features: [
    'Catalogue mode & accessoires',
    'Import CSV automatisé',
    'Prix grossiste',
    'Livraison Europe'
  ],
  authType: 'credentials',
  authFields: [
    { name: 'Identifiant', key: 'username', type: 'text', placeholder: 'Votre identifiant BTS', required: true },
    { name: 'Mot de passe', key: 'password', type: 'password', placeholder: 'Votre mot de passe', required: true }
  ],
  documentation: 'https://www.bts-wholesaler.com/help',
  productCount: '50K+',
  deliveryTime: '3-7 jours',
  pricing: 'Prix grossiste',
  color: '#e91e63'
}

export default function BTSConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
