/**
 * Page du connecteur Zalando
 * Leader européen de la mode en ligne
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const zalandoConfig: SupplierConnectorConfig = {
  id: 'zalando',
  name: 'Zalando',
  description: 'La plus grande plateforme de mode en ligne en Europe avec 50+ millions de clients',
  website: 'https://www.zalando.fr',
  category: 'marketplace',
  region: 'Europe',
  features: [
    '50+ millions de clients actifs',
    'Présence dans 25 pays',
    'Programme Zalando Partner Program',
    'Réseau logistique ZFS',
    'Retours gratuits 100 jours',
    'Outils marketing intégrés',
    'Analytics avancés',
    'Support marques premium'
  ],
  authType: 'oauth',
  authFields: [
    {
      name: 'Client ID',
      key: 'client_id',
      type: 'text',
      placeholder: 'Votre Client ID Zalando',
      required: true,
      helpText: 'Depuis le Partner Portal'
    },
    {
      name: 'Client Secret',
      key: 'client_secret',
      type: 'password',
      placeholder: 'Votre Client Secret',
      required: true
    },
    {
      name: 'Merchant ID',
      key: 'merchant_id',
      type: 'text',
      placeholder: 'Votre ID marchand',
      required: true
    }
  ],
  documentation: 'https://developers.zalando.com/',
  pricing: 'Commission variable',
  productCount: '500K+ (mode)',
  deliveryTime: '2-5 jours',
  color: '#FF6900'
}

export default function ZalandoConnectorPage() {
  return <SupplierConnectorTemplate config={zalandoConfig} />
}
