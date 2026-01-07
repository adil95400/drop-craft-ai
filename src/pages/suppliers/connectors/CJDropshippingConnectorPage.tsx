/**
 * Page du connecteur CJ Dropshipping
 * Plateforme de dropshipping Chine vers monde
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const cjConfig: SupplierConnectorConfig = {
  id: 'cj-dropshipping',
  name: 'CJ Dropshipping',
  description: 'Plateforme complète de dropshipping avec sourcing, stockage et expédition mondiale',
  website: 'https://www.cjdropshipping.com',
  category: 'dropshipping',
  region: 'Mondial',
  features: [
    'Sourcing de produits personnalisé',
    'Entreposage dans plusieurs pays',
    'Expédition mondiale rapide',
    'Branding et packaging personnalisé',
    'Intégration automatique des commandes',
    'Suivi de colis en temps réel',
    'Prix compétitifs depuis la Chine',
    'Support 24/7'
  ],
  authType: 'api_key',
  authFields: [
    {
      name: 'Clé API CJ',
      key: 'api_key',
      type: 'password',
      placeholder: 'Votre clé API CJ Dropshipping',
      required: true,
      helpText: 'Trouvez-la dans CJ > Settings > API'
    },
    {
      name: 'Email du compte',
      key: 'email',
      type: 'email',
      placeholder: 'votre@email.com',
      required: true
    }
  ],
  documentation: 'https://developers.cjdropshipping.com/',
  pricing: 'Gratuit (frais par commande)',
  productCount: '400K+',
  deliveryTime: '7-15 jours',
  color: '#00B894'
}

export default function CJDropshippingConnectorPage() {
  return <SupplierConnectorTemplate config={cjConfig} />
}
