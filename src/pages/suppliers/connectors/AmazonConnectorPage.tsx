/**
 * Page du connecteur Amazon
 * Import depuis Amazon Seller/Vendor Central
 */

import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const amazonConfig: SupplierConnectorConfig = {
  id: 'amazon',
  name: 'Amazon',
  description: 'Connectez votre compte Amazon Seller Central pour synchroniser vos produits',
  website: 'https://sellercentral.amazon.com',
  category: 'marketplace',
  region: 'Mondial',
  features: [
    'Synchronisation multi-marketplace',
    'Gestion des stocks FBA/FBM',
    'Import/Export de produits',
    'Suivi des commandes automatisé',
    'Rapports de performance',
    'Gestion des prix dynamique',
    'Support SP-API officielle',
    'Multi-régions (US, EU, JP...)'
  ],
  authType: 'oauth',
  authFields: [
    {
      name: 'Client ID',
      key: 'client_id',
      type: 'text',
      placeholder: 'amzn1.application-oa2-client.xxx',
      required: true,
      helpText: 'Depuis Developer Central'
    },
    {
      name: 'Client Secret',
      key: 'client_secret',
      type: 'password',
      placeholder: 'Votre Client Secret',
      required: true
    },
    {
      name: 'Refresh Token',
      key: 'refresh_token',
      type: 'password',
      placeholder: 'Token de rafraîchissement',
      required: true,
      helpText: 'Obtenu après autorisation OAuth'
    },
    {
      name: 'Marketplace',
      key: 'marketplace',
      type: 'text',
      placeholder: 'FR, DE, ES, IT, US...',
      required: true
    }
  ],
  documentation: 'https://developer-docs.amazon.com/sp-api/',
  pricing: 'Commission variable',
  productCount: 'Vos produits',
  deliveryTime: '1-5 jours (Prime)',
  color: '#FF9900'
}

export default function AmazonConnectorPage() {
  return <SupplierConnectorTemplate config={amazonConfig} />
}
