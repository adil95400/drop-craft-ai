/**
 * Adaptateur CSV/XML/JSON
 * Import et normalisation depuis fichiers
 */

import Papa from 'papaparse'
import { ImportRequest, NormalizedProduct, ImportSource } from '../types'
import { BaseAdapter } from './BaseAdapter'

export class CSVAdapter extends BaseAdapter {
  name = 'CSV/XML/JSON Adapter'
  supportedSources: ImportSource[] = ['csv', 'xml', 'json']

  async extract(request: ImportRequest): Promise<any[]> {
    // Fichier fourni
    if (request.file) {
      const content = await this.readFile(request.file)
      return this.parseContent(content, this.detectFormat(request.file.name))
    }

    // Données JSON directes
    if (request.data) {
      return Array.isArray(request.data) ? request.data : [request.data]
    }

    // URL de fichier
    if (request.url) {
      const response = await fetch(request.url)
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
      
      const content = await response.text()
      const format = this.detectFormat(request.url)
      return this.parseContent(content, format)
    }

    return []
  }

  normalize(raw: any): NormalizedProduct {
    // Mapping flexible des champs
    const title = raw.title || raw.name || raw.product_name || raw.Title || raw.Name || ''
    const description = raw.description || raw.body || raw.body_html || raw.Description || ''
    const price = this.parsePrice(raw.price || raw.Price || raw.sale_price || 0)
    const images = this.extractImages(raw)

    return this.finalize({
      title,
      description,
      price,
      costPrice: this.parsePrice(raw.cost_price || raw.cost || raw.Cost),
      compareAtPrice: this.parsePrice(raw.compare_at_price || raw.original_price || raw.msrp),
      sku: raw.sku || raw.SKU || raw.product_id || raw.handle,
      barcode: raw.barcode || raw.ean || raw.upc || raw.gtin,
      images,
      category: this.mapCategory(raw.category || raw.product_type || raw.Category),
      tags: this.parseTags(raw.tags || raw.Tags),
      brand: raw.brand || raw.vendor || raw.Brand || raw.Vendor,
      stock: this.parseStock(raw.stock || raw.inventory || raw.quantity || raw.Quantity),
      weight: parseFloat(raw.weight || raw.Weight || '0') || undefined,
      weightUnit: this.parseWeightUnit(raw.weight_unit || raw.weight_units),
      variants: this.extractVariants(raw),
      seoTitle: raw.seo_title || raw.meta_title || title.slice(0, 60),
      seoDescription: raw.seo_description || raw.meta_description || description.slice(0, 160),
      sourceUrl: raw.url || raw.link || raw.product_url,
      sourceId: raw.id || raw.product_id || raw.sku,
      sourcePlatform: 'csv',
      attributes: this.extractAttributes(raw),
      sourceAttribution: this.createAttribution('html', 75)
    })
  }

  private async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('File read failed'))
      reader.readAsText(file)
    })
  }

  private detectFormat(filename: string): 'csv' | 'xml' | 'json' {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.json')) return 'json'
    if (lower.endsWith('.xml')) return 'xml'
    return 'csv'
  }

  private parseContent(content: string, format: 'csv' | 'xml' | 'json'): any[] {
    switch (format) {
      case 'json':
        return this.parseJSON(content)
      case 'xml':
        return this.parseXML(content)
      case 'csv':
      default:
        return this.parseCSV(content)
    }
  }

  private parseCSV(content: string): any[] {
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
    })
    return result.data as any[]
  }

  private parseJSON(content: string): any[] {
    const data = JSON.parse(content)
    
    // Gérer différentes structures
    if (Array.isArray(data)) return data
    if (data.products && Array.isArray(data.products)) return data.products
    if (data.items && Array.isArray(data.items)) return data.items
    if (data.data && Array.isArray(data.data)) return data.data
    
    return [data]
  }

  private parseXML(content: string): any[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/xml')
    
    // Chercher les éléments produit
    const productElements = 
      doc.querySelectorAll('product') ||
      doc.querySelectorAll('item') ||
      doc.querySelectorAll('offer') ||
      doc.querySelectorAll('entry')

    return Array.from(productElements).map(el => this.xmlElementToObject(el))
  }

  private xmlElementToObject(element: Element): any {
    const obj: any = {}
    
    // Attributs
    Array.from(element.attributes).forEach(attr => {
      obj[attr.name] = attr.value
    })

    // Éléments enfants
    Array.from(element.children).forEach(child => {
      const key = child.tagName.toLowerCase()
      const value = child.children.length > 0 
        ? this.xmlElementToObject(child) 
        : child.textContent?.trim()
      
      // Gérer les arrays
      if (obj[key]) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]]
        obj[key].push(value)
      } else {
        obj[key] = value
      }
    })

    return obj
  }

  private extractImages(raw: any): string[] {
    const images: string[] = []

    // Différents formats d'images
    const imageFields = ['images', 'image', 'image_url', 'image_src', 'picture', 'photos', 'gallery']
    
    for (const field of imageFields) {
      const value = raw[field] || raw[field.charAt(0).toUpperCase() + field.slice(1)]
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v: any) => {
            if (typeof v === 'string') images.push(v)
            else if (v.src) images.push(v.src)
            else if (v.url) images.push(v.url)
          })
        } else if (typeof value === 'string') {
          // Peut être séparé par virgules ou pipes
          value.split(/[,|]/).forEach(url => {
            const trimmed = url.trim()
            if (trimmed) images.push(trimmed)
          })
        }
      }
    }

    return [...new Set(images.filter(Boolean))]
  }

  private extractVariants(raw: any): NormalizedProduct['variants'] {
    if (!raw.variants && !raw.Variants) return undefined

    const variants = raw.variants || raw.Variants
    if (typeof variants === 'string') {
      try {
        return JSON.parse(variants)
      } catch {
        return undefined
      }
    }

    if (!Array.isArray(variants)) return undefined

    return variants.map((v: any, index: number) => ({
      id: v.id || `variant-${index}`,
      sku: v.sku,
      title: v.title || v.name || 'Default',
      price: this.parsePrice(v.price),
      stock: this.parseStock(v.stock || v.inventory),
      options: v.options || {}
    }))
  }

  private parseTags(tags: any): string[] {
    if (!tags) return []
    if (Array.isArray(tags)) return tags.map(t => String(t).trim())
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean)
    return []
  }

  private parseWeightUnit(unit?: string): 'kg' | 'g' | 'lb' | 'oz' | undefined {
    if (!unit) return undefined
    const lower = unit.toLowerCase()
    if (lower === 'kg' || lower === 'kilogram') return 'kg'
    if (lower === 'g' || lower === 'gram') return 'g'
    if (lower === 'lb' || lower === 'pound') return 'lb'
    if (lower === 'oz' || lower === 'ounce') return 'oz'
    return 'kg'
  }

  private extractAttributes(raw: any): Record<string, string> {
    const attrs: Record<string, string> = {}
    const excludeKeys = new Set([
      'title', 'name', 'description', 'price', 'sku', 'images', 'image',
      'category', 'brand', 'stock', 'weight', 'variants', 'tags', 'id'
    ])

    Object.entries(raw).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase()
      if (!excludeKeys.has(lowerKey) && typeof value === 'string' && value.length < 500) {
        attrs[key] = value
      }
    })

    return Object.keys(attrs).length > 0 ? attrs : {}
  }
}
