/**
 * Page du connecteur PrestaShop
 * Import depuis boutique PrestaShop
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const prestaConfig: SupplierConnectorConfig = {
  id: 'prestashop',
  name: 'PrestaShop',
  description: 'Connectez votre boutique PrestaShop pour synchroniser votre catalogue produits',
  website: 'https://www.prestashop.com',
  category: 'ecommerce',
  region: 'Mondial',
  features: [
    'Import catalogue complet',
    'Synchronisation des stocks',
    'Gestion des déclinaisons',
    'Import des images',
    'Conservation des attributs',
    'Mapping des catégories',
    'Multi-boutique supporté',
    'Mise à jour temps réel'
  ],
  authType: 'api_key',
  authFields: [
    {
      name: 'URL de la boutique',
      key: 'shop_url',
      type: 'text',
      placeholder: 'https://votre-boutique.com',
      required: true,
      helpText: 'URL complète de votre PrestaShop'
    },
    {
      name: 'Clé Webservice',
      key: 'webservice_key',
      type: 'password',
      placeholder: 'Votre clé webservice',
      required: true,
      helpText: 'Paramètres > Webservice > Ajouter une clé'
    }
  ],
  documentation: 'https://devdocs.prestashop-project.org/8/webservice/',
  pricing: 'Gratuit (open source)',
  productCount: 'Variable',
  deliveryTime: 'N/A',
  color: '#DF0067'
}

export default function PrestaShopConnectorPage() {
  return <SupplierConnectorTemplate config={prestaConfig} />
}
