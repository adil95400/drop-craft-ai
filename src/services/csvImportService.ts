import Papa from 'papaparse'
import { Product } from '@/lib/supabase'

export interface ShopifyCSVRow {
  'Title': string
  'URL handle': string
  'Description': string
  'Vendor': string
  'Product category': string
  'Type': string
  'Tags': string
  'Published on online store': string
  'Status': string
  'SKU': string
  'Barcode': string
  'Price': string
  'Compare-at price': string
  'Cost per item': string
  'Inventory quantity': string
  'Weight value (grams)': string
  'Product image URL': string
  'SEO title': string
  'SEO description': string
  [key: string]: string
}

export interface ParsedProduct {
  name: string
  description?: string
  price: number
  cost_price?: number
  sku?: string
  category?: string
  stock_quantity?: number
  status: 'active' | 'inactive' | 'draft'
  image_url?: string
  weight?: number
  supplier?: string
  tags?: string[]
  seo_title?: string
  seo_description?: string
  profit_margin?: number
}

export interface ImportPreview {
  new: ParsedProduct[]
  updates: {
    product: ParsedProduct
    existingProduct: Product
    changes: string[]
  }[]
  conflicts: {
    product: ParsedProduct
    existingProduct: Product
    conflictType: 'sku' | 'name'
  }[]
  errors: {
    row: number
    product: Partial<ParsedProduct>
    error: string
  }[]
}

export interface ConflictResolution {
  action: 'skip' | 'update' | 'create_new'
  productIndex: number
}

class CSVImportService {
  /**
   * Parse le fichier CSV Shopify
   */
  async parseShopifyCSV(file: File): Promise<ShopifyCSVRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse<ShopifyCSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`Erreur de parsing: ${results.errors[0].message}`))
          } else {
            resolve(results.data)
          }
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  /**
   * Convertir une ligne Shopify en produit
   */
  private convertShopifyRowToProduct(row: ShopifyCSVRow): ParsedProduct {
    const price = parseFloat(row['Price']) || 0
    const costPrice = row['Cost per item'] ? parseFloat(row['Cost per item']) : undefined
    
    // Calculer la marge si coût disponible
    const profitMargin = costPrice && price > 0 
      ? ((price - costPrice) / price) * 100 
      : undefined

    // Convertir le statut Shopify vers notre format
    let status: 'active' | 'inactive' | 'draft' = 'active'
    if (row['Status'] === 'draft') {
      status = 'draft'
    } else if (row['Published on online store'] === 'FALSE' || row['Status'] === 'archived') {
      status = 'inactive'
    }

    return {
      name: row['Title'] || 'Produit sans nom',
      description: row['Description'] || undefined,
      price,
      cost_price: costPrice,
      sku: row['SKU'] || undefined,
      category: row['Product category'] || row['Type'] || undefined,
      stock_quantity: row['Inventory quantity'] ? parseInt(row['Inventory quantity']) : undefined,
      status,
      image_url: row['Product image URL'] || undefined,
      weight: row['Weight value (grams)'] ? parseFloat(row['Weight value (grams)']) : undefined,
      supplier: row['Vendor'] || undefined,
      tags: row['Tags'] ? row['Tags'].split(',').map(t => t.trim()).filter(Boolean) : undefined,
      seo_title: row['SEO title'] || undefined,
      seo_description: row['SEO description'] || undefined,
      profit_margin: profitMargin
    }
  }

  /**
   * Analyser les différences avec les produits existants
   */
  analyzeImport(
    csvRows: ShopifyCSVRow[],
    existingProducts: Product[]
  ): ImportPreview {
    const preview: ImportPreview = {
      new: [],
      updates: [],
      conflicts: [],
      errors: []
    }

    // Grouper les produits Shopify par titre (car les variantes ont plusieurs lignes)
    const groupedRows = this.groupShopifyRows(csvRows)

    groupedRows.forEach((rows, index) => {
      try {
        // Prendre la première ligne pour les infos principales
        const mainRow = rows[0]
        const parsedProduct = this.convertShopifyRowToProduct(mainRow)

        // Chercher un produit existant par SKU ou nom
        const matchBySku = parsedProduct.sku 
          ? existingProducts.find(p => p.sku === parsedProduct.sku)
          : undefined
        
        const matchByName = existingProducts.find(p => 
          p.name.toLowerCase() === parsedProduct.name.toLowerCase()
        )

        if (matchBySku && matchByName && matchBySku.id !== matchByName.id) {
          // Conflit : SKU et nom correspondent à des produits différents
          preview.conflicts.push({
            product: parsedProduct,
            existingProduct: matchBySku,
            conflictType: 'sku'
          })
        } else if (matchBySku || matchByName) {
          // Mise à jour d'un produit existant
          const existing = matchBySku || matchByName!
          const changes = this.detectChanges(parsedProduct, existing)
          
          if (changes.length > 0) {
            preview.updates.push({
              product: parsedProduct,
              existingProduct: existing,
              changes
            })
          }
        } else {
          // Nouveau produit
          preview.new.push(parsedProduct)
        }
      } catch (error) {
        preview.errors.push({
          row: index + 2, // +2 car ligne 1 = header, et index commence à 0
          product: rows[0] as any,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    })

    return preview
  }

  /**
   * Grouper les lignes Shopify par produit (gérer les variantes)
   */
  private groupShopifyRows(rows: ShopifyCSVRow[]): ShopifyCSVRow[][] {
    const groups: ShopifyCSVRow[][] = []
    let currentGroup: ShopifyCSVRow[] = []

    rows.forEach(row => {
      if (row['Title']) {
        // Nouvelle ligne de produit principal
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [row]
      } else if (currentGroup.length > 0) {
        // Ligne de variante (pas de titre)
        currentGroup.push(row)
      }
    })

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  /**
   * Détecter les changements entre produit importé et existant
   */
  private detectChanges(imported: ParsedProduct, existing: Product): string[] {
    const changes: string[] = []

    if (imported.name !== existing.name) {
      changes.push(`Nom: "${existing.name}" → "${imported.name}"`)
    }
    if (imported.price !== existing.price) {
      changes.push(`Prix: ${existing.price}€ → ${imported.price}€`)
    }
    if (imported.cost_price !== existing.cost_price) {
      changes.push(`Coût: ${existing.cost_price || 'N/A'}€ → ${imported.cost_price || 'N/A'}€`)
    }
    if (imported.stock_quantity !== existing.stock_quantity) {
      changes.push(`Stock: ${existing.stock_quantity || 0} → ${imported.stock_quantity || 0}`)
    }
    if (imported.category !== existing.category) {
      changes.push(`Catégorie: ${existing.category || 'N/A'} → ${imported.category || 'N/A'}`)
    }
    if (imported.status !== existing.status) {
      changes.push(`Statut: ${existing.status} → ${imported.status}`)
    }

    return changes
  }

  /**
   * Valider un produit
   */
  validateProduct(product: ParsedProduct): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!product.name || product.name.trim().length === 0) {
      errors.push('Le nom est obligatoire')
    }
    if (product.name && product.name.length > 200) {
      errors.push('Le nom ne peut pas dépasser 200 caractères')
    }
    if (product.price < 0) {
      errors.push('Le prix ne peut pas être négatif')
    }
    if (product.cost_price && product.cost_price < 0) {
      errors.push('Le coût ne peut pas être négatif')
    }
    if (product.stock_quantity && product.stock_quantity < 0) {
      errors.push('Le stock ne peut pas être négatif')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Obtenir les statistiques de l'import
   */
  getImportStats(preview: ImportPreview) {
    return {
      total: preview.new.length + preview.updates.length + preview.conflicts.length,
      new: preview.new.length,
      updates: preview.updates.length,
      conflicts: preview.conflicts.length,
      errors: preview.errors.length
    }
  }
}

export const csvImportService = new CSVImportService()
