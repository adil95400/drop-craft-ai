import { supabase } from '@/integrations/supabase/client'
import { SupplierProduct } from '@/types/suppliers'

interface DuplicateGroup {
  products: SupplierProduct[]
  reason: 'sku' | 'ean' | 'title_fuzzy' | 'image_hash'
  confidence: number
}

export class DeduplicationService {
  private static instance: DeduplicationService

  private constructor() {}

  static getInstance(): DeduplicationService {
    if (!DeduplicationService.instance) {
      DeduplicationService.instance = new DeduplicationService()
    }
    return DeduplicationService.instance
  }

  // Déduplication principale
  async deduplicateProducts(products: SupplierProduct[]): Promise<SupplierProduct[]> {
    console.log(`Starting deduplication for ${products.length} products`)

    // Récupérer les produits existants pour comparaison
    const existingProducts = await this.getExistingProducts()
    const allProducts = [...existingProducts, ...products]

    // Grouper par doublons potentiels
    const duplicateGroups = await this.findDuplicates(allProducts)
    
    // Résoudre les doublons
    const uniqueProducts = await this.resolveDuplicates(products, duplicateGroups)

    console.log(`Deduplication completed: ${products.length} -> ${uniqueProducts.length} products`)
    
    return uniqueProducts
  }

  // Récupération des produits existants
  private async getExistingProducts(): Promise<SupplierProduct[]> {
    const { data: products } = await supabase
      .from('imported_products')
      .select(`
        id, sku, name, description, price, cost_price, currency,
        stock_quantity, image_urls, supplier_sku, supplier_name,
        category, brand, weight, ean, gtin
      `)

    return products?.map(p => ({
      id: p.id || '',
      sku: p.sku || '',
      title: p.name || '',
      description: p.description || '',
      price: p.price || 0,
      costPrice: p.cost_price || 0,
      currency: p.currency || 'EUR',
      stock: p.stock_quantity || 0,
      images: Array.isArray(p.image_urls) ? p.image_urls : [],
      category: p.category || '',
      brand: p.brand || '',
      weight: p.weight || 0,
      variants: [],
      attributes: {},
      supplier: {
        id: p.supplier_name || 'unknown',
        name: p.supplier_name || 'Unknown',
        sku: p.supplier_sku || p.sku || ''
      }
    })) || []
  }

  // Détection des doublons
  private async findDuplicates(products: SupplierProduct[]): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = []
    const processed = new Set<string>()

    // 1. Doublons par SKU exact
    const skuGroups = this.groupBySku(products)
    skuGroups.forEach(group => {
      if (group.length > 1) {
        duplicateGroups.push({
          products: group,
          reason: 'sku',
          confidence: 1.0
        })
        group.forEach(p => processed.add(p.sku))
      }
    })

    // 2. Doublons par EAN/GTIN
    const remainingProducts = products.filter(p => !processed.has(p.sku))
    const eanGroups = this.groupByEan(remainingProducts)
    eanGroups.forEach(group => {
      if (group.length > 1) {
        duplicateGroups.push({
          products: group,
          reason: 'ean',
          confidence: 0.95
        })
        group.forEach(p => processed.add(p.sku))
      }
    })

    // 3. Doublons par titre similaire (fuzzy matching)
    const titleCandidates = products.filter(p => !processed.has(p.sku))
    const titleGroups = await this.groupByFuzzyTitle(titleCandidates)
    titleGroups.forEach(group => {
      if (group.length > 1) {
        duplicateGroups.push({
          products: group,
          reason: 'title_fuzzy',
          confidence: 0.8
        })
        group.forEach(p => processed.add(p.sku))
      }
    })

    return duplicateGroups
  }

  // Groupement par SKU
  private groupBySku(products: SupplierProduct[]): SupplierProduct[][] {
    const groups = new Map<string, SupplierProduct[]>()
    
    products.forEach(product => {
      const key = product.sku.toLowerCase().trim()
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(product)
    })

    return Array.from(groups.values())
  }

  // Groupement par EAN/GTIN
  private groupByEan(products: SupplierProduct[]): SupplierProduct[][] {
    const groups = new Map<string, SupplierProduct[]>()
    
    products.forEach(product => {
      const ean = (product as any).ean || (product as any).gtin
      if (ean && ean.trim()) {
        const key = ean.toLowerCase().trim()
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(product)
      }
    })

    return Array.from(groups.values())
  }

  // Groupement par titre similaire (algorithme de Levenshtein simplifié)
  private async groupByFuzzyTitle(products: SupplierProduct[]): Promise<SupplierProduct[][]> {
    const groups: SupplierProduct[][] = []
    const processed = new Set<number>()

    for (let i = 0; i < products.length; i++) {
      if (processed.has(i)) continue

      const group: SupplierProduct[] = [products[i]]
      const baseTitle = this.normalizeTitle(products[i].title)

      for (let j = i + 1; j < products.length; j++) {
        if (processed.has(j)) continue

        const compareTitle = this.normalizeTitle(products[j].title)
        const similarity = this.calculateTitleSimilarity(baseTitle, compareTitle)

        if (similarity > 0.85) { // 85% de similarité
          group.push(products[j])
          processed.add(j)
        }
      }

      if (group.length > 1) {
        groups.push(group)
      }
      processed.add(i)
    }

    return groups
  }

  // Normalisation des titres pour comparaison
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .replace(/\b(the|and|or|with|for|in|on|at|to|a|an)\b/g, '') // Supprimer les mots vides
      .trim()
  }

  // Calcul de similarité entre titres
  private calculateTitleSimilarity(title1: string, title2: string): number {
    if (title1 === title2) return 1.0

    const words1 = title1.split(' ').filter(w => w.length > 2)
    const words2 = title2.split(' ').filter(w => w.length > 2)

    if (words1.length === 0 || words2.length === 0) return 0

    const commonWords = words1.filter(word => words2.includes(word))
    const totalWords = Math.max(words1.length, words2.length)

    return commonWords.length / totalWords
  }

  // Résolution des doublons (garde le meilleur produit)
  private async resolveDuplicates(
    newProducts: SupplierProduct[], 
    duplicateGroups: DuplicateGroup[]
  ): Promise<SupplierProduct[]> {
    const uniqueProducts: SupplierProduct[] = []
    const processedSkus = new Set<string>()

    for (const group of duplicateGroups) {
      const bestProduct = this.selectBestProduct(group.products, group.reason)
      
      // Si le meilleur produit est dans les nouveaux produits, on le garde
      const newProductInGroup = group.products.find(p => 
        newProducts.some(np => np.sku === p.sku)
      )

      if (newProductInGroup && newProductInGroup.sku === bestProduct.sku) {
        uniqueProducts.push(bestProduct)
      }

      // Marquer tous les SKUs du groupe comme traités
      group.products.forEach(p => processedSkus.add(p.sku))

      // Logger la déduplication
      await this.logDeduplication(group, bestProduct)
    }

    // Ajouter les produits sans doublons
    newProducts.forEach(product => {
      if (!processedSkus.has(product.sku)) {
        uniqueProducts.push(product)
      }
    })

    return uniqueProducts
  }

  // Sélection du meilleur produit dans un groupe de doublons
  private selectBestProduct(products: SupplierProduct[], reason: string): SupplierProduct {
    // Critères de sélection par ordre de priorité :
    // 1. Produit avec le plus d'informations complètes
    // 2. Produit avec le meilleur prix (rapport qualité/prix)
    // 3. Produit avec le plus de stock
    // 4. Produit le plus récent

    let bestProduct = products[0]
    let bestScore = this.calculateProductScore(bestProduct)

    for (let i = 1; i < products.length; i++) {
      const score = this.calculateProductScore(products[i])
      if (score > bestScore) {
        bestProduct = products[i]
        bestScore = score
      }
    }

    return bestProduct
  }

  // Calcul du score de qualité d'un produit
  private calculateProductScore(product: SupplierProduct): number {
    let score = 0

    // Complétude des informations (40%)
    if (product.title && product.title.length > 10) score += 10
    if (product.description && product.description.length > 50) score += 10
    if (product.images && product.images.length > 0) score += 10
    if (product.category) score += 5
    if (product.brand) score += 5

    // Pricing (30%)
    if (product.price > 0) score += 15
    if (product.costPrice && product.costPrice > 0) score += 15

    // Stock (20%)
    if (product.stock > 0) score += 10
    if (product.stock > 10) score += 10

    // Données techniques (10%)
    if (product.weight) score += 3
    if ((product as any).ean || (product as any).gtin) score += 4
    if (product.variants && product.variants.length > 0) score += 3

    return score
  }

  // Logging de la déduplication
  private async logDeduplication(group: DuplicateGroup, selectedProduct: SupplierProduct): Promise<void> {
    const duplicateSkus = group.products.map(p => p.sku)
    const discardedSkus = duplicateSkus.filter(sku => sku !== selectedProduct.sku)

    try {
      // Utiliser activity_logs en attendant que deduplication_logs soit créé
      await supabase.from('activity_logs').insert({
        user_id: 'system', // Placeholder
        action: 'deduplication',
        description: `Deduplication performed: ${group.reason}`,
        metadata: {
          reason: group.reason,
          confidence: group.confidence,
          selected_sku: selectedProduct.sku,
          discarded_skus: discardedSkus,
          duplicate_count: group.products.length,
          titles: group.products.map(p => p.title),
          suppliers: group.products.map(p => p.supplier.name)
        }
      })
    } catch (error) {
      console.error('Failed to log deduplication:', error)
    }
  }

  // Statistiques de déduplication
  async getDeduplicationStats(days: number = 30): Promise<any> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('action', 'deduplication')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error) return null

    const stats = {
      total_duplicates_found: data?.length || 0,
      total_products_discarded: data?.reduce((sum, log) => {
        const metadata = log.metadata as any
        return sum + (metadata?.discarded_skus?.length || 0)
      }, 0) || 0,
      by_reason: {} as Record<string, number>,
      average_confidence: 0
    }

    data?.forEach(log => {
      const metadata = log.metadata as any
      const reason = metadata?.reason || 'unknown'
      stats.by_reason[reason] = (stats.by_reason[reason] || 0) + 1
    })

    if (data && data.length > 0) {
      stats.average_confidence = data.reduce((sum, log) => {
        const metadata = log.metadata as any
        return sum + (metadata?.confidence || 0)
      }, 0) / data.length
    }

    return stats
  }
}