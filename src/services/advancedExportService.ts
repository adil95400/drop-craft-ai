import Papa from 'papaparse'
import { Product } from '@/lib/supabase'

const loadXLSX = () => import('xlsx');

export type ExportFormat = 'csv' | 'csv-shopify' | 'excel'

export interface ExportColumn {
  key: string
  label: string
  enabled: boolean
  shopifyKey?: string
}

export interface ShopifyExportData {
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
  'Option1 name': string
  'Option1 value': string
  'Option2 name': string
  'Option2 value': string
  'Option3 name': string
  'Option3 value': string
  'Price': string
  'Compare-at price': string
  'Cost per item': string
  'Charge tax': string
  'Tax code': string
  'Unit price total measure': string
  'Unit price total measure unit': string
  'Unit price base measure': string
  'Unit price base measure unit': string
  'Inventory tracker': string
  'Inventory quantity': string
  'Continue selling when out of stock': string
  'Weight value (grams)': string
  'Weight unit for display': string
  'Requires shipping': string
  'Fulfillment service': string
  'Product image URL': string
  'Image position': string
  'Image alt text': string
  'Variant image URL': string
  'Gift card': string
  'SEO title': string
  'SEO description': string
  'Google Shopping / Google product category': string
  'Google Shopping / Gender': string
  'Google Shopping / Age group': string
  'Google Shopping / MPN': string
  'Google Shopping / AdWords Grouping': string
  'Google Shopping / AdWords labels': string
  'Google Shopping / Condition': string
  'Google Shopping / Custom product': string
  'Google Shopping / Custom label 0': string
  'Google Shopping / Custom label 1': string
  'Google Shopping / Custom label 2': string
  'Google Shopping / Custom label 3': string
  'Google Shopping / Custom label 4': string
}

class AdvancedExportService {
  private defaultColumns: ExportColumn[] = [
    { key: 'name', label: 'Nom', enabled: true, shopifyKey: 'Title' },
    { key: 'description', label: 'Description', enabled: true, shopifyKey: 'Description' },
    { key: 'sku', label: 'SKU', enabled: true, shopifyKey: 'SKU' },
    { key: 'price', label: 'Prix', enabled: true, shopifyKey: 'Price' },
    { key: 'cost_price', label: 'Prix de revient', enabled: false, shopifyKey: 'Cost per item' },
    { key: 'profit_margin', label: 'Marge (%)', enabled: false, shopifyKey: '' },
    { key: 'category', label: 'Catégorie', enabled: true, shopifyKey: 'Product category' },
    { key: 'stock_quantity', label: 'Stock', enabled: true, shopifyKey: 'Inventory quantity' },
    { key: 'status', label: 'Statut', enabled: true, shopifyKey: 'Status' },
    { key: 'image_url', label: 'Image URL', enabled: true, shopifyKey: 'Product image URL' },
    { key: 'weight', label: 'Poids (g)', enabled: false, shopifyKey: 'Weight value (grams)' },
    { key: 'supplier', label: 'Fournisseur', enabled: false, shopifyKey: 'Vendor' },
    { key: 'tags', label: 'Tags', enabled: false, shopifyKey: 'Tags' },
    { key: 'seo_title', label: 'Titre SEO', enabled: false, shopifyKey: 'SEO title' },
    { key: 'seo_description', label: 'Description SEO', enabled: false, shopifyKey: 'SEO description' },
    { key: 'seo_keywords', label: 'Mots-clés SEO', enabled: false, shopifyKey: '' },
    { key: 'created_at', label: 'Date de création', enabled: false, shopifyKey: '' },
    { key: 'updated_at', label: 'Date de modification', enabled: false, shopifyKey: '' },
  ]

  getDefaultColumns(): ExportColumn[] {
    return [...this.defaultColumns]
  }

  /**
   * Convert product to Shopify format
   */
  private toShopifyFormat(product: Product): Partial<ShopifyExportData> {
    const urlHandle = product.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return {
      'Title': product.name || '',
      'URL handle': urlHandle,
      'Description': product.description || '',
      'Vendor': product.supplier || '',
      'Product category': product.category || '',
      'Type': product.category || '',
      'Tags': Array.isArray(product.tags) ? product.tags.join(', ') : '',
      'Published on online store': product.status === 'active' ? 'TRUE' : 'FALSE',
      'Status': product.status || 'active',
      'SKU': product.sku || '',
      'Barcode': '',
      'Option1 name': '',
      'Option1 value': '',
      'Option2 name': '',
      'Option2 value': '',
      'Option3 name': '',
      'Option3 value': '',
      'Price': product.price?.toString() || '0',
      'Compare-at price': '',
      'Cost per item': product.cost_price?.toString() || '',
      'Charge tax': 'TRUE',
      'Tax code': '',
      'Unit price total measure': '',
      'Unit price total measure unit': '',
      'Unit price base measure': '',
      'Unit price base measure unit': '',
      'Inventory tracker': '',
      'Inventory quantity': product.stock_quantity?.toString() || '0',
      'Continue selling when out of stock': 'deny',
      'Weight value (grams)': product.weight?.toString() || '',
      'Weight unit for display': 'g',
      'Requires shipping': 'TRUE',
      'Fulfillment service': 'manual',
      'Product image URL': product.image_url || '',
      'Image position': '1',
      'Image alt text': '',
      'Variant image URL': '',
      'Gift card': 'FALSE',
      'SEO title': product.seo_title || '',
      'SEO description': product.seo_description || '',
      'Google Shopping / Google product category': product.category || '',
      'Google Shopping / Gender': '',
      'Google Shopping / Age group': '',
      'Google Shopping / MPN': product.sku || '',
      'Google Shopping / AdWords Grouping': product.category || '',
      'Google Shopping / AdWords labels': Array.isArray(product.tags) ? product.tags.join(', ') : '',
      'Google Shopping / Condition': 'new',
      'Google Shopping / Custom product': 'FALSE',
      'Google Shopping / Custom label 0': '',
      'Google Shopping / Custom label 1': '',
      'Google Shopping / Custom label 2': '',
      'Google Shopping / Custom label 3': '',
      'Google Shopping / Custom label 4': '',
    }
  }

  /**
   * Export to CSV (standard format)
   */
  exportToCSV(products: Product[], columns: ExportColumn[], filename: string) {
    const enabledColumns = columns.filter(col => col.enabled)
    
    const data = products.map(product => {
      const row: any = {}
      enabledColumns.forEach(col => {
        let value = (product as any)[col.key]
        
        // Format special cases
        if (Array.isArray(value)) {
          value = value.join(', ')
        } else if (value instanceof Date) {
          value = value.toISOString()
        } else if (value === null || value === undefined) {
          value = ''
        }
        
        row[col.label] = value
      })
      return row
    })

    const csv = Papa.unparse(data, { header: true })
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;')
  }

  /**
   * Export to CSV (Shopify format)
   */
  exportToShopifyCSV(products: Product[], filename: string) {
    const shopifyData = products.map(product => this.toShopifyFormat(product))
    const csv = Papa.unparse(shopifyData, { header: true })
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;')
  }

  /**
   * Export to Excel
   */
  async exportToExcel(products: Product[], columns: ExportColumn[], filename: string, format: 'standard' | 'shopify' = 'standard') {
    const XLSX = await loadXLSX();
    let data: any[]
    
    if (format === 'shopify') {
      data = products.map(product => this.toShopifyFormat(product))
    } else {
      const enabledColumns = columns.filter(col => col.enabled)
      data = products.map(product => {
        const row: any = {}
        enabledColumns.forEach(col => {
          let value = (product as any)[col.key]
          
          if (Array.isArray(value)) {
            value = value.join(', ')
          } else if (value instanceof Date) {
            value = value.toISOString()
          } else if (value === null || value === undefined) {
            value = ''
          }
          
          row[col.label] = value
        })
        return row
      })
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits')
    
    const maxWidth = 50
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(
        Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        ),
        maxWidth
      )
    }))
    worksheet['!cols'] = colWidths

    XLSX.writeFile(workbook, filename)
  }

  /**
   * Helper to download file
   */
  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(prefix: string, format: ExportFormat): string {
    const date = new Date().toISOString().split('T')[0]
    const extension = format === 'excel' ? 'xlsx' : 'csv'
    return `${prefix}_${date}.${extension}`
  }
}

export const advancedExportService = new AdvancedExportService()
