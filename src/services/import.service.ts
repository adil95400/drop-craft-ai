import { supabase } from '@/integrations/supabase/client'
import { productsApi } from '@/services/api/client'
import { ImportConfig } from '@/lib/validation/orderSchema'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

export interface ParsedData {
  headers: string[]
  rows: Record<string, any>[]
  totalRows: number
}

export class ImportService {
  /**
   * Parse un fichier CSV ou Excel
   */
  static async parseFile(file: File): Promise<ParsedData> {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    if (extension === 'csv') {
      return this.parseCSV(file)
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.parseExcel(file)
    } else {
      throw new Error('Format de fichier non supporté. Utilisez CSV ou Excel.')
    }
  }

  /**
   * Parse CSV
   */
  private static parseCSV(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data as Record<string, any>[],
            totalRows: results.data.length,
          })
        },
        error: (error) => reject(new Error(`Erreur de parsing CSV: ${error.message}`)),
      })
    })
  }

  /**
   * Parse Excel
   */
  private static async parseExcel(file: File): Promise<ParsedData> {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (jsonData.length === 0) {
      return { headers: [], rows: [], totalRows: 0 }
    }

    const headers = jsonData[0].map(h => String(h).trim())
    const rows = jsonData.slice(1).map(row => {
      const obj: Record<string, any> = {}
      headers.forEach((header, index) => {
        obj[header] = row[index]
      })
      return obj
    })

    return { headers, rows, totalRows: rows.length }
  }

  /**
   * Import principal avec mapping
   */
  static async importData(
    userId: string, 
    parsedData: ParsedData, 
    config: ImportConfig,
    onProgress?: (current: number, total: number) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    }

    const { dataType, mappings, options } = config
    const batchSize = 50

    for (let i = 0; i < parsedData.rows.length; i += batchSize) {
      const batch = parsedData.rows.slice(i, i + batchSize)
      
      for (const row of batch) {
        try {
          // Appliquer le mapping
          const mappedRow = this.applyMapping(row, mappings || {})
          
          // Valider si nécessaire
          if (options.validateData) {
            const validation = this.validateRow(mappedRow, dataType)
            if (!validation.valid) {
              result.failed++
              result.errors.push(`Ligne ${i + 1}: ${validation.error}`)
              continue
            }
          }

          // Vérifier les doublons
          if (options.skipDuplicates || options.updateExisting) {
            const exists = await this.checkDuplicate(userId, mappedRow, dataType)
            
            if (exists && options.skipDuplicates && !options.updateExisting) {
              result.skipped++
              continue
            }
            
            if (exists && options.updateExisting) {
              await this.updateRecord(userId, mappedRow, dataType, exists.id)
              result.imported++
              continue
            }
          }

          // Insérer
          await this.insertRecord(userId, mappedRow, dataType)
          result.imported++
          
        } catch (error) {
          result.failed++
          result.errors.push(`Ligne ${i + 1}: ${error instanceof Error ? error.message : 'Erreur'}`)
        }
      }

      onProgress?.(Math.min(i + batchSize, parsedData.rows.length), parsedData.rows.length)
    }

    result.success = result.failed === 0 || result.imported > 0
    return result
  }

  /**
   * Applique le mapping des colonnes
   */
  private static applyMapping(row: Record<string, any>, mappings: Record<string, string>): Record<string, any> {
    if (Object.keys(mappings).length === 0) return row

    const mapped: Record<string, any> = {}
    Object.entries(mappings).forEach(([sourceColumn, targetField]) => {
      if (sourceColumn in row && targetField) {
        mapped[targetField] = row[sourceColumn]
      }
    })

    // Conserver les champs non mappés qui correspondent déjà
    Object.entries(row).forEach(([key, value]) => {
      if (!mappings[key] && !Object.values(mappings).includes(key)) {
        mapped[key] = value
      }
    })

    return mapped
  }

  /**
   * Valide une ligne selon le type de données
   */
  private static validateRow(row: Record<string, any>, dataType: string): { valid: boolean; error?: string } {
    switch (dataType) {
      case 'products': {
        if (!row.title && !row.name) return { valid: false, error: 'Nom du produit requis' }
        if (row.price !== undefined && (isNaN(Number(row.price)) || Number(row.price) < 0)) {
          return { valid: false, error: 'Prix invalide' }
        }
        return { valid: true }
      }
      case 'customers': {
        if (!row.email) return { valid: false, error: 'Email requis' }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          return { valid: false, error: 'Email invalide' }
        }
        return { valid: true }
      }
      case 'orders': {
        if (!row.order_number) return { valid: false, error: 'Numéro de commande requis' }
        return { valid: true }
      }
      default:
        return { valid: true }
    }
  }

  /**
   * Vérifie si un enregistrement existe déjà
   */
  private static async checkDuplicate(
    userId: string, 
    row: Record<string, any>, 
    dataType: string
  ): Promise<{ id: string } | null> {
    let query

    switch (dataType) {
      case 'products':
        if (row.sku) {
          const resp = await productsApi.list({ per_page: 1, q: row.sku })
          const match = resp.items?.find((p: any) => p.sku === row.sku)
          return match ? { id: match.id } : null
        } else {
          return null
        }
        break
      case 'customers':
        query = supabase.from('customers').select('id').eq('user_id', userId).eq('email', row.email).single()
        break
      case 'orders':
        query = supabase.from('orders').select('id').eq('user_id', userId).eq('order_number', row.order_number).single()
        break
      default:
        return null
    }

    const { data } = await query
    return data as { id: string } | null
  }

  /**
   * Insère un nouvel enregistrement
   */
  private static async insertRecord(userId: string, row: Record<string, any>, dataType: string): Promise<void> {
    const cleanRow = this.cleanRow(row, dataType)
    
    let error: any

    switch (dataType) {
      case 'products': {
        try {
          await productsApi.create({ ...cleanRow, user_id: userId } as any)
        } catch (e: any) {
          error = e
        }
        break
      }
      case 'customers': {
        const result = await supabase.from('customers').insert([{ ...cleanRow, user_id: userId } as any])
        error = result.error
        break
      }
      case 'orders': {
        const result = await supabase.from('orders').insert([{ ...cleanRow, user_id: userId } as any])
        error = result.error
        break
      }
    }

    if (error) throw error
  }

  /**
   * Met à jour un enregistrement existant
   */
  private static async updateRecord(
    userId: string, 
    row: Record<string, any>, 
    dataType: string, 
    id: string
  ): Promise<void> {
    const cleanRow = this.cleanRow(row, dataType)
    let error: any

    switch (dataType) {
      case 'products': {
        const result = await supabase.from('products').update(cleanRow).eq('id', id).eq('user_id', userId)
        error = result.error
        break
      }
      case 'customers': {
        const result = await supabase.from('customers').update(cleanRow).eq('id', id).eq('user_id', userId)
        error = result.error
        break
      }
      case 'orders': {
        const result = await supabase.from('orders').update(cleanRow).eq('id', id).eq('user_id', userId)
        error = result.error
        break
      }
    }

    if (error) throw error
  }

  /**
   * Nettoie les données avant insertion
   */
  private static cleanRow(row: Record<string, any>, dataType: string): Record<string, any> {
    const clean: Record<string, any> = {}
    
    const allowedFields: Record<string, string[]> = {
      products: ['title', 'description', 'price', 'cost_price', 'sku', 'category', 'stock_quantity', 'status', 'image_url', 'tags'],
      customers: ['first_name', 'last_name', 'email', 'phone', 'total_spent', 'total_orders'],
      orders: ['order_number', 'status', 'total_amount', 'currency', 'payment_status', 'tracking_number', 'notes'],
    }

    const fields = allowedFields[dataType] || []
    
    fields.forEach(field => {
      if (row[field] !== undefined && row[field] !== '') {
        // Conversion de types
        if (['price', 'cost_price', 'total_amount', 'total_spent'].includes(field)) {
          clean[field] = Number(row[field]) || 0
        } else if (['stock_quantity', 'total_orders'].includes(field)) {
          clean[field] = parseInt(row[field]) || 0
        } else {
          clean[field] = row[field]
        }
      }
    })

    // Alias name -> title pour products
    if (dataType === 'products' && row.name && !clean.title) {
      clean.title = row.name
    }

    return clean
  }

  /**
   * Retourne les champs cibles pour le mapping
   */
  static getTargetFields(dataType: string): { key: string; label: string; required?: boolean }[] {
    switch (dataType) {
      case 'products':
        return [
          { key: 'title', label: 'Nom du produit', required: true },
          { key: 'description', label: 'Description' },
          { key: 'price', label: 'Prix', required: true },
          { key: 'cost_price', label: 'Prix de revient' },
          { key: 'sku', label: 'SKU' },
          { key: 'category', label: 'Catégorie' },
          { key: 'stock_quantity', label: 'Stock' },
          { key: 'status', label: 'Statut' },
          { key: 'image_url', label: 'URL Image' },
        ]
      case 'customers':
        return [
          { key: 'email', label: 'Email', required: true },
          { key: 'first_name', label: 'Prénom' },
          { key: 'last_name', label: 'Nom' },
          { key: 'phone', label: 'Téléphone' },
          { key: 'total_spent', label: 'Total dépensé' },
          { key: 'total_orders', label: 'Nb Commandes' },
        ]
      case 'orders':
        return [
          { key: 'order_number', label: 'N° Commande', required: true },
          { key: 'status', label: 'Statut' },
          { key: 'total_amount', label: 'Montant total' },
          { key: 'payment_status', label: 'Statut paiement' },
          { key: 'tracking_number', label: 'N° Suivi' },
          { key: 'notes', label: 'Notes' },
        ]
      default:
        return []
    }
  }
}
