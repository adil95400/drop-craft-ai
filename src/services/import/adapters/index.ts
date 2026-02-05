/**
 * Registre des adaptateurs d'import
 */

import { ImportAdapter, ImportSource } from '../types'
import { AliExpressAdapter } from './AliExpressAdapter'
import { AmazonAdapter } from './AmazonAdapter'
import { ShopifyAdapter } from './ShopifyAdapter'
import { CSVAdapter } from './CSVAdapter'
import { GenericURLAdapter } from './GenericURLAdapter'

// Registre des adaptateurs
const adapters: Map<ImportSource, ImportAdapter> = new Map()

// Enregistrer les adaptateurs
adapters.set('aliexpress', new AliExpressAdapter())
adapters.set('temu', new AliExpressAdapter()) // Temu utilise le même adaptateur
adapters.set('amazon', new AmazonAdapter())
adapters.set('ebay', new AmazonAdapter()) // eBay similaire à Amazon
adapters.set('shopify', new ShopifyAdapter())
adapters.set('csv', new CSVAdapter())
adapters.set('xml', new CSVAdapter()) // XML via CSVAdapter avec parsing différent
adapters.set('json', new CSVAdapter())
adapters.set('api', new GenericURLAdapter())
adapters.set('extension', new GenericURLAdapter())

/**
 * Récupère l'adaptateur pour une source donnée
 */
export function getAdapter(source: ImportSource): ImportAdapter | null {
  return adapters.get(source) || null
}

/**
 * Vérifie si une source est supportée
 */
export function isSourceSupported(source: ImportSource): boolean {
  return adapters.has(source)
}

/**
 * Liste des sources supportées
 */
export function getSupportedSources(): ImportSource[] {
  return Array.from(adapters.keys())
}

// Exports
export { AliExpressAdapter } from './AliExpressAdapter'
export { AmazonAdapter } from './AmazonAdapter'
export { ShopifyAdapter } from './ShopifyAdapter'
export { CSVAdapter } from './CSVAdapter'
export { GenericURLAdapter } from './GenericURLAdapter'
