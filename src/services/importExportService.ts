import { supabase } from '@/integrations/supabase/client'
import Papa from 'papaparse'

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  data?: any[]
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json'
  filename?: string
  selectedFields?: string[]
}

class ImportExportService {
  // Import depuis CSV
  async importFromCSV(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Non authentifié')

            const products = results.data.map((row: any) => ({
              name: row.name || row.nom || 'Produit sans nom',
              description: row.description || row.desc || '',
              price: parseFloat(row.price || row.prix || '0'),
              cost_price: parseFloat(row.cost_price || row.prix_achat || '0'),
              sku: row.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              category: row.category || row.categorie || 'Non catégorisé',
              stock_quantity: parseInt(row.stock_quantity || row.stock || '0'),
              status: row.status || 'active',
              user_id: user.id
            }))

            const { data, error } = await supabase
              .from('products')
              .insert(products)
              .select()

            if (error) throw error

            resolve({
              success: true,
              imported: data.length,
              errors: [],
              data
            })
          } catch (error) {
            resolve({
              success: false,
              imported: 0,
              errors: [error instanceof Error ? error.message : 'Erreur inconnue']
            })
          }
        },
        error: (error) => {
          resolve({
            success: false,
            imported: 0,
            errors: [error.message]
          })
        }
      })
    })
  }

  // Import depuis URL (API/JSON)
  async importFromURL(url: string): Promise<ImportResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

      const data = await response.json()
      const products = Array.isArray(data) ? data : [data]

      const formattedProducts = products.map((item: any) => ({
        name: item.name || item.title || item.product_name || 'Produit importé',
        description: item.description || item.desc || item.summary || '',
        price: parseFloat(item.price || item.cost || item.amount || '0'),
        cost_price: parseFloat(item.cost_price || item.wholesale_price || '0'),
        sku: item.sku || item.id || `URL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: item.category || item.type || 'Importé',
        stock_quantity: parseInt(item.stock || item.quantity || '1'),
        image_url: item.image || item.image_url || item.thumbnail || null,
        status: 'active',
        user_id: user.id
      }))

      const { data: insertedData, error } = await supabase
        .from('products')
        .insert(formattedProducts)
        .select()

      if (error) throw error

      return {
        success: true,
        imported: insertedData.length,
        errors: [],
        data: insertedData
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }

  // Import depuis le catalogue
  async importFromCatalog(productIds: string[]): Promise<ImportResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Récupérer les produits du catalogue
      const { data: catalogProducts, error: fetchError } = await supabase
        .from('catalog_products')
        .select('*')
        .in('id', productIds)

      if (fetchError) throw fetchError

      const products = catalogProducts.map(product => ({
        name: product.name,
        description: product.description || '',
        price: product.price,
        cost_price: product.cost_price || product.price * 0.7, // Marge par défaut de 30%
        sku: product.sku || `CAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: product.category || 'Catalogue',
        stock_quantity: 10, // Stock par défaut
        image_url: product.image_url,
        status: 'active',
        user_id: user.id
      }))

      const { data: insertedData, error } = await supabase
        .from('products')
        .insert(products)
        .select()

      if (error) throw error

      return {
        success: true,
        imported: insertedData.length,
        errors: [],
        data: insertedData
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }

  // Export en CSV
  exportToCSV(data: any[], filename = 'export.csv', selectedFields?: string[]) {
    const fields = selectedFields || Object.keys(data[0] || {})
    const filteredData = data.map(item => {
      const filtered: any = {}
      fields.forEach(field => {
        filtered[field] = item[field]
      })
      return filtered
    })

    const csv = Papa.unparse(filteredData)
    this.downloadFile(csv, filename, 'text/csv')
  }

  // Export en JSON
  exportToJSON(data: any[], filename = 'export.json', selectedFields?: string[]) {
    const fields = selectedFields || Object.keys(data[0] || {})
    const filteredData = data.map(item => {
      const filtered: any = {}
      fields.forEach(field => {
        filtered[field] = item[field]
      })
      return filtered
    })

    const json = JSON.stringify(filteredData, null, 2)
    this.downloadFile(json, filename, 'application/json')
  }

  // Export en Excel (simulation avec CSV formaté)
  exportToExcel(data: any[], filename = 'export.xlsx', selectedFields?: string[]) {
    // Pour une vraie implémentation Excel, utiliser une bibliothèque comme SheetJS
    const csvFilename = filename.replace('.xlsx', '.csv')
    this.exportToCSV(data, csvFilename, selectedFields)
  }

  // Utilitaire pour télécharger un fichier
  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Génération IA de produits (simulation)
  async generateWithAI(prompt: string, count = 5): Promise<ImportResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Simulation de génération IA
      const products = Array.from({ length: count }, (_, i) => ({
        name: `Produit IA ${i + 1} - ${prompt.slice(0, 20)}`,
        description: `Produit généré par IA basé sur: ${prompt}. Description détaillée avec caractéristiques innovantes.`,
        price: Math.round((Math.random() * 500 + 50) * 100) / 100,
        cost_price: Math.round((Math.random() * 300 + 20) * 100) / 100,
        sku: `AI-${Date.now()}-${i + 1}`,
        category: 'IA Générée',
        stock_quantity: Math.floor(Math.random() * 100) + 1,
        status: 'active',
        user_id: user.id
      }))

      const { data: insertedData, error } = await supabase
        .from('products')
        .insert(products)
        .select()

      if (error) throw error

      return {
        success: true,
        imported: insertedData.length,
        errors: [],
        data: insertedData
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }

  // Opérations en lot
  async bulkUpdateStatus(productIds: string[], status: 'active' | 'inactive'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status })
        .in('id', productIds)

      return !error
    } catch {
      return false
    }
  }

  async bulkUpdateCategory(productIds: string[], category: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ category })
        .in('id', productIds)

      return !error
    } catch {
      return false
    }
  }

  async bulkDelete(productIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', productIds)

      return !error
    } catch {
      return false
    }
  }

  async bulkUpdatePrices(productIds: string[], priceMultiplier: number): Promise<boolean> {
    try {
      // Récupérer les produits actuels
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, price')
        .in('id', productIds)

      if (fetchError) throw fetchError

      // Mettre à jour chaque produit
      const updates = products.map(product => ({
        id: product.id,
        price: Math.round(product.price * priceMultiplier * 100) / 100
      }))

      const promises = updates.map(update =>
        supabase
          .from('products')
          .update({ price: update.price })
          .eq('id', update.id)
      )

      await Promise.all(promises)
      return true
    } catch {
      return false
    }
  }
}

export const importExportService = new ImportExportService()