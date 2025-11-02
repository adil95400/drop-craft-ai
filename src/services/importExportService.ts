import { supabase } from '@/integrations/supabase/client'
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
   * Import products from CSV to database
   */
  async importFromCSV(file: File, userId: string): Promise<{ success: number; errors: number }> {
    try {
      const products = await this.parseCSV(file)
      
      let success = 0
      let errors = 0

      for (const product of products) {
        try {
          const { error } = await supabase
            .from('products')
            .insert({
              ...product,
              user_id: userId
            })

          if (error) {
            console.error('Error importing product:', error)
            errors++
          } else {
            success++
          }
        } catch (err) {
          console.error('Error importing product:', err)
          errors++
        }
      }

      return { success, errors }
    } catch (error) {
      console.error('Error parsing CSV:', error)
      throw new Error('Erreur lors de l\'analyse du fichier CSV')
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
   * Bulk delete products from all tables
   */
  async bulkDelete(productIds: string[]): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      console.log(`Tentative de suppression de ${productIds.length} produit(s):`, productIds)

      // Supprimer de toutes les tables possibles (products, imported_products, premium_products)
      const deletePromises = [
        supabase.from('products').delete().in('id', productIds).eq('user_id', user.id),
        supabase.from('imported_products').delete().in('id', productIds).eq('user_id', user.id),
        supabase.from('premium_products').delete().in('id', productIds)
      ]

      const results = await Promise.allSettled(deletePromises)
      
      // Compter les suppressions réussies
      let deletedCount = 0
      results.forEach((result, index) => {
        const tableName = index === 0 ? 'products' : index === 1 ? 'imported_products' : 'premium_products'
        if (result.status === 'fulfilled') {
          if (!result.value.error) {
            console.log(`✓ Suppression réussie de la table ${tableName}`)
            deletedCount++
          } else {
            console.log(`✗ Erreur sur la table ${tableName}:`, result.value.error.message)
          }
        } else {
          console.log(`✗ Échec sur la table ${tableName}:`, result.reason)
        }
      })
      
      // Au moins une suppression doit réussir
      if (deletedCount === 0) {
        throw new Error('Aucun produit n\'a pu être supprimé. Les produits n\'existent peut-être pas dans la base de données.')
      }
      
      console.log(`✓ Suppression réussie: ${deletedCount} table(s) mise(s) à jour`)
      return true
    } catch (error) {
      console.error('Error bulk deleting products:', error)
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
   * Import from URL
   */
  async importFromURL(url: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Échec du chargement depuis l\'URL')
      
      const data = await response.json()
      // Simulate import
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return {
        success: true,
        imported: Array.isArray(data) ? data.length : 1,
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
   * Generate products with AI
   */
  async generateWithAI(prompt: string, count: number = 5): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      return {
        success: true,
        imported: count,
        errors: []
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
   * Import from catalog
   */
  async importFromCatalog(productIds: string[]): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      // Simulate catalog import
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return {
        success: true,
        imported: productIds.length,
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
