/**
 * Page du connecteur AliExpress
 * Marketplace mondiale B2C/Dropshipping
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const aliExpressConfig: SupplierConnectorConfig = {
  id: 'aliexpress',
  name: 'AliExpress',
  description: 'La plus grande marketplace mondiale avec des millions de produits à prix fabricant',
  website: 'https://www.aliexpress.com',
  category: 'marketplace',
  region: 'Mondial',
  features: [
    'Des millions de produits disponibles',
    'Prix fabricant compétitifs',
    'Programme AliExpress Dropshipping',
    'Protection acheteur garantie',
    'Import par URL simplifié',
    'Suivi des colis intégré',
    'Multiples options de livraison',
    'Centre de dropshipping dédié'
  ],
  authType: 'api_key',
  authFields: [
    {
      name: 'App Key',
      key: 'app_key',
      type: 'password',
      placeholder: 'Votre App Key AliExpress',
      required: true,
      helpText: 'Créez une app sur AliExpress Open Platform'
    },
    {
      name: 'App Secret',
      key: 'app_secret',
      type: 'password',
      placeholder: 'Votre App Secret',
      required: true
    },
    {
      name: 'Tracking ID',
      key: 'tracking_id',
      type: 'text',
      placeholder: 'ID affilié (optionnel)',
      required: false,
      helpText: 'Pour gagner des commissions sur vos ventes'
    }
  ],
  documentation: 'https://developers.aliexpress.com/',
  pricing: 'Gratuit + commissions',
  productCount: '100M+',
  deliveryTime: '15-45 jours',
  color: '#FF4747'
}

export default function AliExpressConnectorPage() {
  return <SupplierConnectorTemplate config={aliExpressConfig} />
}
