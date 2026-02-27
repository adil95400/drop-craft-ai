import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'
import Papa from 'papaparse'

interface Product {
  id?: string
  name: string
  description?: string
  price: number
  sku?: string
  category?: string
  stock_quantity?: number
  image_url?: string
  status?: 'active' | 'inactive' | 'draft'
  user_id?: string
}

class ImportExportService {
  /**
   * Export products to CSV
   */
  exportToCSV(products: any[], filename: string = 'products.csv') {
    const csv = Papa.unparse(products, {
      header: true,
      columns: [
        'name', 'description', 'price', 'sku', 'category',
        'stock_quantity', 'image_url', 'status'
      ]
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Parse CSV file
   */
  async parseCSV(file: File): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const products = results.data.map((row: any) => ({
            name: row.name || '',
            description: row.description || '',
            price: parseFloat(row.price) || 0,
            sku: row.sku || '',
            category: row.category || '',
            stock_quantity: parseInt(row.stock_quantity) || 0,
            image_url: row.image_url || '',
            status: (row.status || 'active') as 'active' | 'inactive' | 'draft'
          }))
          resolve(products)
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  /**
   * Import products from CSV to database using edge function
   */
  async importFromCSV(file: File, userId: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const csvContent = await file.text()
      
      logger.info('Sending CSV to edge function', { component: 'ImportExport', action: 'csv_import' })
      
      const { data, error } = await supabase.functions.invoke('csv-import', {
        body: {
          userId,
          csvContent,
          source: 'manual'
        }
      })

      if (error) {
        console.error('❌ Erreur edge function:', error)
        throw new Error(error.message || 'Erreur lors de l\'import CSV')
      }

      if (data?.success) {
        logger.info(`Import successful: ${data.imported} products`, { component: 'ImportExport' })
        return {
          success: true,
          imported: data.imported || 0,
          errors: []
        }
      } else {
        console.error('❌ Erreur dans la réponse:', data)
        throw new Error(data?.error || 'Erreur lors de l\'import')
      }
    } catch (error) {
      console.error('❌ Erreur import CSV:', error)
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }

  /**
   * Export all products to CSV
   */
  async exportAllProducts(userId: string, filename?: string) {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      this.exportToCSV(
        products || [],
        filename || `all_products_${new Date().toISOString().split('T')[0]}.csv`
      )

      return true
    } catch (error) {
      console.error('Error exporting products:', error)
      throw new Error('Erreur lors de l\'export des produits')
    }
  }

  /**
   * Bulk update category
   */
  async bulkUpdateCategory(productIds: string[], category: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ category })
        .in('id', productIds)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error bulk updating category:', error)
      throw new Error('Erreur lors de la mise à jour de la catégorie')
    }
  }

  /**
   * Bulk update status
   */
  async bulkUpdateStatus(productIds: string[], status: 'active' | 'inactive' | 'draft'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status })
        .in('id', productIds)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error bulk updating status:', error)
      throw new Error('Erreur lors de la mise à jour du statut')
    }
  }

  /**
   * Bulk update prices
   */
  async bulkUpdatePrices(productIds: string[], multiplier: number): Promise<boolean> {
    try {
      // Récupérer les produits actuels
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, price')
        .in('id', productIds)

      if (fetchError) throw fetchError

      // Mettre à jour chaque produit
      const updates = products?.map(product => ({
        id: product.id,
        price: Math.round((product.price * multiplier) * 100) / 100 // Arrondir à 2 décimales
      })) || []

      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({ price: update.price })
          .eq('id', update.id)

        if (error) throw error
      }

      return true
    } catch (error) {
      console.error('Error bulk updating prices:', error)
      throw new Error('Erreur lors de la mise à jour des prix')
    }
  }

  /**
   * Bulk delete products from all tables (products, imported_products, premium_products)
   */
  async bulkDelete(productIds: string[]): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      logger.info(`Bulk deleting ${productIds.length} product(s)`, { component: 'ImportExport', action: 'bulk_delete' })

      // Delete via API
      const { productsApi } = await import('@/services/api/client')
      const deletePromises = productIds.map(id => productsApi.delete(id).catch(() => null))

      const results = await Promise.allSettled(deletePromises)
      
      // Compter et logger les résultats
      let totalDeleted = 0
      const tableNames = ['products', 'imported_products']
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value.error) {
          logger.debug(`Delete succeeded for table ${tableNames[index]}`, { component: 'ImportExport' })
          totalDeleted++
        } else if (result.status === 'fulfilled' && result.value.error) {
          logger.warn(`Delete failed for table ${tableNames[index]}`, { component: 'ImportExport', metadata: { error: result.value.error.message } })
        }
      })
      
      // Au moins une suppression doit réussir
      if (totalDeleted === 0) {
        console.error('❌ Aucune table n\'a pu être modifiée')
        throw new Error('Les produits sélectionnés n\'existent pas dans la base de données ou vous n\'avez pas les permissions nécessaires.')
      }
      
      logger.info(`Bulk delete completed: ${productIds.length} product(s) from ${totalDeleted} table(s)`, { component: 'ImportExport' })
      return true
    } catch (error) {
      console.error('❌ Erreur lors de la suppression en masse:', error)
      throw error
    }
  }

  /**
   * Duplicate products
   */
  async bulkDuplicate(productIds: string[], userId: string): Promise<boolean> {
    try {
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)

      if (fetchError) throw fetchError

      const duplicates = products?.map(product => {
        const { id, created_at, updated_at, ...rest } = product
        return {
          ...rest,
          name: `${product.name} (copie)`,
          sku: product.sku ? `${product.sku}-COPY` : null,
          user_id: userId
        }
      }) || []

      const { error: insertError } = await supabase
        .from('products')
        .insert(duplicates)

      if (insertError) throw insertError
      return true
    } catch (error) {
      console.error('Error duplicating products:', error)
      throw new Error('Erreur lors de la duplication des produits')
    }
  }

  /**
   * Generate CSV template
   */
  downloadTemplate() {
    const template = [
      {
        name: 'Exemple Produit',
        description: 'Description du produit',
        price: '29.99',
        sku: 'SKU-001',
        category: 'Électronique',
        stock_quantity: '100',
        image_url: 'https://example.com/image.jpg',
        status: 'active'
      }
    ]

    this.exportToCSV(template, 'template_produits.csv')
  }

  /**
   * Export to JSON format
   */
  exportToJSON(products: any[], filename: string = 'products.json') {
    const jsonStr = JSON.stringify(products, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Export to Excel format (simplified, using CSV with .xlsx extension)
   */
  exportToExcel(products: any[], filename: string = 'products.xlsx') {
    // For now, export as CSV (proper Excel export would require a library like xlsx)
    this.exportToCSV(products, filename.replace('.xlsx', '.csv'))
  }

  /**
   * Import from URL - Real implementation
   */
  async importFromURL(url: string, userId: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Échec du chargement depuis l\'URL')
      
      const data = await response.json()
      
      // Insérer les produits dans la DB
      const products = Array.isArray(data) ? data : [data]
      const productsToInsert = products.map(p => ({
        user_id: userId,
        title: p.name || 'Produit importé',
        description: p.description || '',
        price: parseFloat(p.price) || 0,
        sku: p.sku || '',
        category: p.category || '',
        stock_quantity: parseInt(p.stock_quantity) || 0,
        status: (p.status || 'active') as 'active' | 'inactive'
      }))
      
      const { error } = await supabase
        .from('products')
        .insert(productsToInsert as any)
      
      if (error) throw error
      
      return {
        success: true,
        imported: productsToInsert.length,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }

  /**
   * Generate products with AI - Real implementation using edge function
   */
  async generateWithAI(prompt: string, userId: string, count: number = 5): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      // Appel à l'edge function AI pour générer les produits
      const { data, error } = await supabase.functions.invoke('ai-generate-products', {
        body: {
          userId,
          prompt,
          count
        }
      })
      
      if (error) throw error
      
      if (data?.success) {
        return {
          success: true,
          imported: data.imported || count,
          errors: []
        }
      } else {
        throw new Error(data?.error || 'Erreur de génération')
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Erreur de génération']
      }
    }
  }

  /**
   * Import from catalog - Real implementation
   */
  async importFromCatalog(productIds: string[], userId: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      // Récupérer les produits du catalogue
      const { data: catalogProducts, error: fetchError } = await (supabase
        .from('products') as any)
        .select('*')
        .in('id', productIds)
      
      if (fetchError) throw fetchError
      
      // Copier dans la table products de l'utilisateur
      const productsToInsert = catalogProducts?.map(p => ({
        user_id: userId,
        title: p.title || 'Sans nom',
        description: p.description || '',
        price: p.price || 0,
        category: p.category || '',
        image_url: p.image_urls?.[0] || '',
        status: 'active' as const
      })) || []
      
      const { error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert as any)
      
      if (insertError) throw insertError
      
      return {
        success: true,
        imported: productsToInsert.length,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Erreur d\'import depuis le catalogue']
      }
    }
  }
}

export const importExportService = new ImportExportService()
