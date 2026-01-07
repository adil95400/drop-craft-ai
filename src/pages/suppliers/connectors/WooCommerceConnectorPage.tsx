/**
 * Page du connecteur WooCommerce
 * Import depuis boutique WooCommerce/WordPress
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const wooConfig: SupplierConnectorConfig = {
  id: 'woocommerce',
  name: 'WooCommerce',
  description: 'Connectez votre boutique WooCommerce pour importer et synchroniser vos produits',
  website: 'https://woocommerce.com',
  category: 'ecommerce',
  region: 'Mondial',
  features: [
    'Import du catalogue complet',
    'Sync des stocks et prix',
    'Gestion des variantes',
    'Import des catégories',
    'Conservation des attributs',
    'Webhooks pour mises à jour',
    'Support des extensions populaires',
    'Mapping personnalisé'
  ],
  authType: 'api_key',
  authFields: [
    {
      name: 'URL du site',
      key: 'site_url',
      type: 'text',
      placeholder: 'https://votre-site.com',
      required: true,
      helpText: 'URL complète avec https://'
    },
    {
      name: 'Consumer Key',
      key: 'consumer_key',
      type: 'password',
      placeholder: 'ck_xxxxxxxx',
      required: true,
      helpText: 'WooCommerce > Paramètres > API'
    },
    {
      name: 'Consumer Secret',
      key: 'consumer_secret',
      type: 'password',
      placeholder: 'cs_xxxxxxxx',
      required: true
    }
  ],
  documentation: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
  pricing: 'Gratuit (open source)',
  productCount: 'Variable',
  deliveryTime: 'N/A',
  color: '#9B5C8F'
}

export default function WooCommerceConnectorPage() {
  return <SupplierConnectorTemplate config={wooConfig} />
}
