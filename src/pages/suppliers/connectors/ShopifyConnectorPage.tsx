/**
 * Page du connecteur Shopify
 * Import/Sync depuis boutique Shopify
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const shopifyConfig: SupplierConnectorConfig = {
  id: 'shopify',
  name: 'Shopify',
  description: 'Importez et synchronisez les produits depuis une boutique Shopify existante',
  website: 'https://www.shopify.com',
  category: 'ecommerce',
  region: 'Mondial',
  features: [
    'Import complet du catalogue',
    'Synchronisation bidirectionnelle',
    'Gestion des variantes',
    'Import des images HD',
    'Conservation des métadonnées',
    'Mapping des catégories',
    'Mise à jour des stocks',
    'Webhooks temps réel'
  ],
  authType: 'api_key',
  authFields: [
    {
      name: 'URL de la boutique',
      key: 'shop_url',
      type: 'text',
      placeholder: 'votre-boutique.myshopify.com',
      required: true,
      helpText: 'Sans https://'
    },
    {
      name: 'Access Token',
      key: 'access_token',
      type: 'password',
      placeholder: 'shpat_xxxxxxxx',
      required: true,
      helpText: 'Créez une app privée dans Shopify Admin'
    }
  ],
  documentation: 'https://shopify.dev/docs/api',
  pricing: 'Inclus Shopify',
  productCount: 'Variable',
  deliveryTime: 'N/A',
  color: '#96BF48'
}

export default function ShopifyConnectorPage() {
  return <SupplierConnectorTemplate config={shopifyConfig} />
}
