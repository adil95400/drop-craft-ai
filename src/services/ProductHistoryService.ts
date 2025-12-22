import { supabase } from '@/integrations/supabase/client'
import type { UnifiedProduct } from './ProductsUnifiedService'

export interface ProductHistoryEntry {
  id: string
  user_id: string
  product_id: string
  product_name: string
  change_type: 'created' | 'updated' | 'deleted' | 'restored'
  changed_fields: any
  previous_values: any
  new_values: any
  snapshot: any
  changed_by_email: string | null
  created_at: string
}

export class ProductHistoryService {
  /**
   * Enregistre une modification de produit dans l'historique
   */
  static async recordChange(
    userId: string,
    productId: string,
    productName: string,
    changeType: 'created' | 'updated' | 'deleted' | 'restored',
    previousData: UnifiedProduct | null,
    newData: UnifiedProduct,
    userEmail?: string
  ) {
    try {
      const changedFields = this.detectChangedFields(previousData, newData)
      const previousValues = previousData ? this.extractRelevantFields(previousData, changedFields) : null
      const newValues = this.extractRelevantFields(newData, changedFields)

      // Use price_history table as it exists in the schema
      const { error } = await supabase.from('price_history').insert([{
        user_id: userId,
        product_id: productId,
        change_reason: `${changeType}: ${productName}`,
        old_price: previousData?.price || null,
        new_price: newData?.price || null,
        price_change: (newData?.price || 0) - (previousData?.price || 0)
      }])

      if (error) throw error
    } catch (error) {
      console.error('Failed to record product history:', error)
      // Ne pas bloquer l'opération principale si l'historique échoue
    }
  }

  /**
   * Récupère l'historique d'un produit
   */
  static async getProductHistory(
    userId: string,
    productId: string
  ): Promise<ProductHistoryEntry[]> {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((d: any) => ({
      id: d.id,
      user_id: d.user_id,
      product_id: d.product_id,
      product_name: d.change_reason?.split(': ')[1] || 'Unknown',
      change_type: d.change_reason?.split(':')[0] || 'updated',
      changed_fields: ['price'],
      previous_values: { price: d.old_price },
      new_values: { price: d.new_price },
      snapshot: {},
      changed_by_email: null,
      created_at: d.created_at
    })) as ProductHistoryEntry[]
  }

  /**
   * Récupère l'historique récent de tous les produits
   */
  static async getRecentHistory(
    userId: string,
    limit: number = 50
  ): Promise<ProductHistoryEntry[]> {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map((d: any) => ({
      id: d.id,
      user_id: d.user_id,
      product_id: d.product_id,
      product_name: d.change_reason?.split(': ')[1] || 'Unknown',
      change_type: d.change_reason?.split(':')[0] || 'updated',
      changed_fields: ['price'],
      previous_values: { price: d.old_price },
      new_values: { price: d.new_price },
      snapshot: {},
      changed_by_email: null,
      created_at: d.created_at
    })) as ProductHistoryEntry[]
  }

  /**
   * Restaure un produit à partir d'une version antérieure
   */
  static async restoreVersion(
    userId: string,
    historyEntry: ProductHistoryEntry
  ): Promise<UnifiedProduct> {
    const snapshot = historyEntry.snapshot
    
    // Enregistrer cette restauration dans l'historique
    await this.recordChange(
      userId,
      snapshot.id || historyEntry.product_id,
      snapshot.name || historyEntry.product_name,
      'restored',
      null,
      snapshot,
      historyEntry.changed_by_email || undefined
    )

    return snapshot
  }

  /**
   * Détecte les champs modifiés entre deux versions
   */
  private static detectChangedFields(
    previous: UnifiedProduct | null,
    current: UnifiedProduct
  ): string[] {
    if (!previous) return ['all']

    const fields: string[] = []
    const relevantFields = [
      'name',
      'description',
      'price',
      'cost_price',
      'stock_quantity',
      'category',
      'status',
      'sku',
      'image_url',
      'profit_margin',
    ]

    relevantFields.forEach((field) => {
      const prevValue = previous[field as keyof UnifiedProduct]
      const currValue = current[field as keyof UnifiedProduct]

      if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
        fields.push(field)
      }
    })

    return fields
  }

  /**
   * Extrait les valeurs des champs pertinents
   */
  private static extractRelevantFields(
    product: UnifiedProduct,
    fields: string[]
  ): Record<string, any> {
    if (fields.includes('all')) {
      return {
        name: product.name,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity,
        category: product.category,
        status: product.status,
        sku: product.sku,
        image_url: product.image_url,
        profit_margin: product.profit_margin,
      }
    }

    const values: Record<string, any> = {}
    fields.forEach((field) => {
      values[field] = product[field as keyof UnifiedProduct]
    })
    return values
  }

  /**
   * Formate le libellé d'un champ pour l'affichage
   */
  static formatFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      name: 'Nom',
      description: 'Description',
      price: 'Prix',
      cost_price: 'Prix de revient',
      stock_quantity: 'Stock',
      category: 'Catégorie',
      status: 'Statut',
      sku: 'SKU',
      image_url: 'Image',
      profit_margin: 'Marge',
      all: 'Création',
    }
    return labels[field] || field
  }

  /**
   * Formate une valeur pour l'affichage
   */
  static formatValue(field: string, value: any): string {
    if (value === null || value === undefined) return '-'
    
    switch (field) {
      case 'price':
      case 'cost_price':
      case 'profit_margin':
        return typeof value === 'number' ? `${value.toFixed(2)} €` : String(value)
      case 'stock_quantity':
        return typeof value === 'number' ? `${value} unités` : String(value)
      case 'status':
        const statusLabels: Record<string, string> = {
          active: 'Actif',
          inactive: 'Inactif',
          archived: 'Archivé',
        }
        return statusLabels[value] || value
      default:
        return String(value)
    }
  }
}
