import { supabase } from '@/integrations/supabase/client'
import { ExportConfig } from '@/lib/validation/orderSchema'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export interface ExportResult {
  success: boolean
  filename: string
  recordCount: number
  error?: string
}

export class ExportService {
  /**
   * Export principal - gère tous les types de données et formats
   */
  static async exportData(userId: string, config: ExportConfig): Promise<ExportResult> {
    try {
      // 1. Récupérer les données selon le type
      const data = await this.fetchData(userId, config)
      
      if (data.length === 0) {
        return { success: false, filename: '', recordCount: 0, error: 'Aucune donnée à exporter' }
      }

      // 2. Filtrer les colonnes
      const filteredData = this.filterColumns(data, config.columns)
      
      // 3. Générer le fichier selon le format
      const filename = this.generateFilename(config.dataType, config.format)
      
      switch (config.format) {
        case 'csv':
          await this.exportToCSV(filteredData, filename)
          break
        case 'xlsx':
          await this.exportToExcel(filteredData, filename, config.dataType)
          break
        case 'json':
          await this.exportToJSON(filteredData, filename)
          break
      }

      return { success: true, filename, recordCount: filteredData.length }
    } catch (error) {
      console.error('Export error:', error)
      return { 
        success: false, 
        filename: '', 
        recordCount: 0, 
        error: error instanceof Error ? error.message : 'Erreur d\'export' 
      }
    }
  }

  /**
   * Récupère les données selon le type
   */
  private static async fetchData(userId: string, config: ExportConfig): Promise<any[]> {
    const { dataType, filters } = config

    switch (dataType) {
      case 'products': {
        let query = supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
        
        if (filters?.status) query = query.eq('status', filters.status)
        if (!filters?.includeArchived) query = query.neq('status', 'archived')
        
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        return data || []
      }

      case 'orders': {
        let query = supabase
          .from('orders')
          .select(`*, order_items(*)`)
          .eq('user_id', userId)
        
        if (filters?.status) query = query.eq('status', filters.status)
        if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom.toISOString())
        if (filters?.dateTo) query = query.lte('created_at', filters.dateTo.toISOString())
        
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        
        // Flatten order data for export
        return (data || []).map(order => ({
          ...order,
          items_count: order.order_items?.length || 0,
          items_details: order.order_items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', '),
        }))
      }

      case 'customers': {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return data || []
      }

      default:
        return []
    }
  }

  /**
   * Filtre les colonnes à exporter
   */
  private static filterColumns(data: any[], columns: string[]): any[] {
    if (!columns || columns.length === 0) return data
    
    return data.map(row => {
      const filtered: Record<string, any> = {}
      columns.forEach(col => {
        if (col in row) {
          filtered[col] = row[col]
        }
      })
      return filtered
    })
  }

  /**
   * Export CSV
   */
  private static async exportToCSV(data: any[], filename: string): Promise<void> {
    const csv = Papa.unparse(data, {
      header: true,
      delimiter: ';', // Standard français
    })
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }) // BOM pour Excel
    saveAs(blob, filename)
  }

  /**
   * Export Excel
   */
  private static async exportToExcel(data: any[], filename: string, sheetName: string): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    // Style des colonnes
    const maxWidth: Record<number, number> = {}
    data.forEach(row => {
      Object.keys(row).forEach((key, i) => {
        const len = String(row[key] || '').length
        maxWidth[i] = Math.max(maxWidth[i] || 10, len + 2)
      })
    })

    worksheet['!cols'] = Object.values(maxWidth).map(w => ({ wch: Math.min(w + 2, 50) }))
    
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, filename)
  }

  /**
   * Export JSON
   */
  private static async exportToJSON(data: any[], filename: string): Promise<void> {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    saveAs(blob, filename)
  }

  /**
   * Génère le nom du fichier
   */
  private static generateFilename(dataType: string, format: string): string {
    const date = new Date().toISOString().split('T')[0]
    return `export_${dataType}_${date}.${format}`
  }

  /**
   * Retourne les colonnes disponibles par type de données
   */
  static getAvailableColumns(dataType: string): { key: string; label: string }[] {
    switch (dataType) {
      case 'products':
        return [
          { key: 'id', label: 'ID' },
          { key: 'title', label: 'Nom' },
          { key: 'description', label: 'Description' },
          { key: 'price', label: 'Prix' },
          { key: 'cost_price', label: 'Coût' },
          { key: 'sku', label: 'SKU' },
          { key: 'category', label: 'Catégorie' },
          { key: 'stock_quantity', label: 'Stock' },
          { key: 'status', label: 'Statut' },
          { key: 'image_url', label: 'Image' },
          { key: 'created_at', label: 'Date création' },
        ]
      case 'orders':
        return [
          { key: 'id', label: 'ID' },
          { key: 'order_number', label: 'N° Commande' },
          { key: 'status', label: 'Statut' },
          { key: 'total_amount', label: 'Total' },
          { key: 'currency', label: 'Devise' },
          { key: 'payment_status', label: 'Paiement' },
          { key: 'tracking_number', label: 'N° Suivi' },
          { key: 'items_count', label: 'Nb Articles' },
          { key: 'items_details', label: 'Détails articles' },
          { key: 'created_at', label: 'Date création' },
        ]
      case 'customers':
        return [
          { key: 'id', label: 'ID' },
          { key: 'first_name', label: 'Prénom' },
          { key: 'last_name', label: 'Nom' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Téléphone' },
          { key: 'total_spent', label: 'Total dépensé' },
          { key: 'total_orders', label: 'Nb Commandes' },
          { key: 'created_at', label: 'Date création' },
        ]
      default:
        return []
    }
  }
}
