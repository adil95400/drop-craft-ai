/**
 * SupplierDataMapper - Unified mapping service for all supplier integrations
 * Normalizes product data from different suppliers into a standard internal format
 */

export interface StandardProduct {
  external_id: string
  sku: string
  name: string
  description: string
  price: number
  cost_price: number
  currency: string
  stock_quantity: number
  images: string[]
  category: string
  brand?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }
  variants?: Array<{
    sku: string
    name: string
    price: number
    stock: number
    attributes: Record<string, string>
  }>
  attributes: Record<string, any>
  status: 'active' | 'inactive' | 'draft'
  supplier_id: string
  supplier_name: string
}

export interface SupplierRawProduct {
  [key: string]: any
}

export class SupplierDataMapper {
  private static instance: SupplierDataMapper

  static getInstance(): SupplierDataMapper {
    if (!SupplierDataMapper.instance) {
      SupplierDataMapper.instance = new SupplierDataMapper()
    }
    return SupplierDataMapper.instance
  }

  /**
   * Main mapping method - routes to appropriate supplier mapper
   */
  mapProduct(rawProduct: SupplierRawProduct, supplierName: string): StandardProduct {
    const normalizedName = supplierName.toLowerCase()

    switch (normalizedName) {
      case 'bigbuy':
        return this.mapBigBuyProduct(rawProduct)
      case 'cj':
      case 'cjdropshipping':
        return this.mapCJProduct(rawProduct)
      case 'btswholesaler':
      case 'bts':
        return this.mapBTSProduct(rawProduct)
      case 'matterhorn':
        return this.mapMatterhornProduct(rawProduct)
      case 'vidaxl':
        return this.mapVidaXLProduct(rawProduct)
      case 'aliexpress':
        return this.mapAliExpressProduct(rawProduct)
      case 'shopify':
        return this.mapShopifyProduct(rawProduct)
      case 'woocommerce':
        return this.mapWooCommerceProduct(rawProduct)
      default:
        return this.mapGenericProduct(rawProduct, supplierName)
    }
  }

  /**
   * BigBuy product mapping
   */
  private mapBigBuyProduct(raw: any): StandardProduct {
    return {
      external_id: raw.id?.toString() || raw.sku,
      sku: raw.sku || raw.id?.toString(),
      name: raw.name || raw.title,
      description: raw.description || '',
      price: parseFloat(raw.retailPrice || raw.price || 0),
      cost_price: parseFloat(raw.wholesalePrice || raw.cost || 0),
      currency: raw.currency || 'EUR',
      stock_quantity: parseInt(raw.stock || raw.inStock || 0),
      images: Array.isArray(raw.images) ? raw.images : [raw.image].filter(Boolean),
      category: raw.category || 'Uncategorized',
      brand: raw.brand || '',
      weight: parseFloat(raw.weight || 0),
      dimensions: raw.dimensions ? {
        length: raw.dimensions.length || 0,
        width: raw.dimensions.width || 0,
        height: raw.dimensions.height || 0,
        unit: raw.dimensions.unit || 'cm'
      } : undefined,
      attributes: {
        ean: raw.ean,
        tags: raw.tags,
        ...raw.attributes
      },
      status: raw.active ? 'active' : 'inactive',
      supplier_id: 'bigbuy',
      supplier_name: 'BigBuy'
    }
  }

  /**
   * CJ Dropshipping product mapping
   */
  private mapCJProduct(raw: any): StandardProduct {
    return {
      external_id: raw.pid || raw.id?.toString(),
      sku: raw.productSku || raw.sku,
      name: raw.productName || raw.productNameEn,
      description: raw.description || raw.productDescEn || '',
      price: parseFloat(raw.sellPrice || raw.price || 0),
      cost_price: parseFloat(raw.originalPrice || raw.cost || 0),
      currency: 'USD',
      stock_quantity: parseInt(raw.productStock || raw.stock || 0),
      images: Array.isArray(raw.productImage) 
        ? raw.productImage 
        : [raw.productImage].filter(Boolean),
      category: raw.categoryName || 'General',
      brand: raw.brandName || '',
      weight: parseFloat(raw.productWeight || 0),
      variants: raw.variants?.map((v: any) => ({
        sku: v.vid,
        name: v.variantName,
        price: parseFloat(v.variantSellPrice || 0),
        stock: parseInt(v.variantStock || 0),
        attributes: v.variantKey || {}
      })),
      attributes: {
        sourceFrom: raw.sourceFrom,
        packType: raw.packType,
        ...raw.attributes
      },
      status: 'active',
      supplier_id: 'cj',
      supplier_name: 'CJ Dropshipping'
    }
  }

  /**
   * BTS Wholesaler product mapping
   */
  private mapBTSProduct(raw: any): StandardProduct {
    return {
      external_id: raw.product_id?.toString() || raw.id?.toString(),
      sku: raw.sku || raw.reference,
      name: raw.name || raw.product_name,
      description: raw.description || raw.description_short || '',
      price: parseFloat(raw.price || raw.price_ttc || 0),
      cost_price: parseFloat(raw.wholesale_price || raw.price_ht || 0),
      currency: 'EUR',
      stock_quantity: parseInt(raw.quantity || raw.stock || 0),
      images: Array.isArray(raw.images) ? raw.images : [raw.image_url].filter(Boolean),
      category: raw.category_name || 'Sport',
      brand: raw.manufacturer_name || raw.brand || '',
      weight: parseFloat(raw.weight || 0),
      attributes: {
        ean13: raw.ean13,
        reference: raw.reference,
        ...raw.features
      },
      status: raw.active === '1' || raw.active === true ? 'active' : 'inactive',
      supplier_id: 'btswholesaler',
      supplier_name: 'BTS Wholesaler'
    }
  }

  /**
   * Matterhorn product mapping
   */
  private mapMatterhornProduct(raw: any): StandardProduct {
    return {
      external_id: raw.articleNumber || raw.id?.toString(),
      sku: raw.articleNumber || raw.sku,
      name: raw.description || raw.name,
      description: raw.extendedDescription || raw.description || '',
      price: parseFloat(raw.recommendedRetailPrice || raw.price || 0),
      cost_price: parseFloat(raw.wholesalePrice || raw.purchasePrice || 0),
      currency: 'EUR',
      stock_quantity: parseInt(raw.stockAmount || raw.stock || 0),
      images: Array.isArray(raw.images) ? raw.images : [raw.imageUrl].filter(Boolean),
      category: raw.category || 'Outdoor',
      brand: raw.brand || raw.manufacturer || '',
      weight: parseFloat(raw.weight || 0),
      attributes: {
        ean: raw.ean,
        color: raw.color,
        size: raw.size,
        ...raw.attributes
      },
      status: 'active',
      supplier_id: 'matterhorn',
      supplier_name: 'Matterhorn'
    }
  }

  /**
   * VidaXL product mapping
   */
  private mapVidaXLProduct(raw: any): StandardProduct {
    return {
      external_id: raw.id?.toString() || raw.sku,
      sku: raw.sku || raw.article_number,
      name: raw.title || raw.name,
      description: raw.description || '',
      price: parseFloat(raw.price || raw.retail_price || 0),
      cost_price: parseFloat(raw.cost || raw.wholesale_price || raw.price * 0.6),
      currency: 'EUR',
      stock_quantity: parseInt(raw.stock || raw.quantity || 0),
      images: Array.isArray(raw.images) ? raw.images : [raw.image].filter(Boolean),
      category: raw.category || 'Mobilier',
      brand: raw.brand || 'VidaXL',
      weight: parseFloat(raw.weight || 0),
      dimensions: raw.dimensions,
      attributes: raw.attributes || {},
      status: 'active',
      supplier_id: 'vidaxl',
      supplier_name: 'VidaXL'
    }
  }

  /**
   * AliExpress product mapping
   */
  private mapAliExpressProduct(raw: any): StandardProduct {
    return {
      external_id: raw.product_id?.toString() || raw.id?.toString(),
      sku: raw.product_id?.toString() || raw.sku,
      name: raw.subject || raw.product_title || raw.name,
      description: raw.detail || raw.description || '',
      price: parseFloat(raw.target_sale_price || raw.sale_price || 0),
      cost_price: parseFloat(raw.target_original_price || raw.original_price || 0),
      currency: raw.target_sale_price_currency || 'USD',
      stock_quantity: parseInt(raw.quantity || 999),
      images: Array.isArray(raw.product_main_image_url) 
        ? raw.product_main_image_url.split(';')
        : [raw.product_main_image_url].filter(Boolean),
      category: raw.category_name || 'General',
      brand: raw.brand || '',
      variants: raw.aeop_ae_product_s_k_us?.map((v: any) => ({
        sku: v.id,
        name: v.sku_property_name,
        price: parseFloat(v.sku_price || 0),
        stock: parseInt(v.sku_stock || 0),
        attributes: v.sku_property_values || {}
      })),
      attributes: {
        store_id: raw.owner_member_id,
        ...raw.attributes
      },
      status: 'active',
      supplier_id: 'aliexpress',
      supplier_name: 'AliExpress'
    }
  }

  /**
   * Shopify product mapping
   */
  private mapShopifyProduct(raw: any): StandardProduct {
    const variant = raw.variants?.[0] || {}
    return {
      external_id: raw.id?.toString(),
      sku: variant.sku || raw.id?.toString(),
      name: raw.title,
      description: raw.body_html || raw.description || '',
      price: parseFloat(variant.price || 0),
      cost_price: parseFloat(variant.compare_at_price || variant.price * 0.5),
      currency: 'EUR',
      stock_quantity: parseInt(variant.inventory_quantity || 0),
      images: raw.images?.map((img: any) => img.src) || [],
      category: raw.product_type || 'General',
      brand: raw.vendor || '',
      variants: raw.variants?.map((v: any) => ({
        sku: v.sku,
        name: v.title,
        price: parseFloat(v.price || 0),
        stock: parseInt(v.inventory_quantity || 0),
        attributes: {
          option1: v.option1,
          option2: v.option2,
          option3: v.option3
        }
      })),
      attributes: {
        tags: raw.tags,
        handle: raw.handle
      },
      status: raw.status || 'active',
      supplier_id: 'shopify',
      supplier_name: 'Shopify'
    }
  }

  /**
   * WooCommerce product mapping
   */
  private mapWooCommerceProduct(raw: any): StandardProduct {
    return {
      external_id: raw.id?.toString(),
      sku: raw.sku || raw.id?.toString(),
      name: raw.name,
      description: raw.description || raw.short_description || '',
      price: parseFloat(raw.price || 0),
      cost_price: parseFloat(raw.regular_price || raw.price * 0.5),
      currency: 'EUR',
      stock_quantity: parseInt(raw.stock_quantity || 0),
      images: raw.images?.map((img: any) => img.src) || [],
      category: raw.categories?.[0]?.name || 'General',
      brand: raw.brands?.[0]?.name || '',
      variants: raw.variations?.map((v: any) => ({
        sku: v.sku,
        name: v.name,
        price: parseFloat(v.price || 0),
        stock: parseInt(v.stock_quantity || 0),
        attributes: v.attributes || {}
      })),
      attributes: {
        type: raw.type,
        tags: raw.tags
      },
      status: raw.status || 'active',
      supplier_id: 'woocommerce',
      supplier_name: 'WooCommerce'
    }
  }

  /**
   * Generic fallback mapping
   */
  private mapGenericProduct(raw: any, supplierName: string): StandardProduct {
    return {
      external_id: raw.id?.toString() || raw.sku || raw.external_id,
      sku: raw.sku || raw.id?.toString(),
      name: raw.name || raw.title || raw.product_name || 'Produit sans nom',
      description: raw.description || raw.desc || '',
      price: parseFloat(raw.price || raw.retail_price || 0),
      cost_price: parseFloat(raw.cost_price || raw.wholesale_price || raw.price * 0.6 || 0),
      currency: raw.currency || 'EUR',
      stock_quantity: parseInt(raw.stock || raw.quantity || raw.stock_quantity || 0),
      images: this.normalizeImages(raw.images || raw.image || raw.image_url),
      category: raw.category || raw.category_name || 'General',
      brand: raw.brand || raw.manufacturer || '',
      weight: parseFloat(raw.weight || 0),
      attributes: raw.attributes || {},
      status: (raw.status || raw.active) ? 'active' : 'inactive',
      supplier_id: supplierName.toLowerCase().replace(/\s+/g, '_'),
      supplier_name: supplierName
    }
  }

  /**
   * Normalize image URLs
   */
  private normalizeImages(images: any): string[] {
    if (!images) return []
    if (typeof images === 'string') {
      return images.split(',').map(url => url.trim()).filter(Boolean)
    }
    if (Array.isArray(images)) {
      return images.map(img => 
        typeof img === 'string' ? img : img.url || img.src
      ).filter(Boolean)
    }
    return []
  }

  /**
   * Batch mapping for multiple products
   */
  mapProducts(rawProducts: SupplierRawProduct[], supplierName: string): StandardProduct[] {
    return rawProducts.map(raw => this.mapProduct(raw, supplierName))
  }

  /**
   * Validate mapped product has required fields
   */
  validateProduct(product: StandardProduct): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    if (!product.name || product.name === 'Produit sans nom') {
      issues.push('Nom de produit manquant')
    }
    if (!product.sku) {
      issues.push('SKU manquant')
    }
    if (product.price <= 0) {
      issues.push('Prix invalide')
    }
    if (!product.images || product.images.length === 0) {
      issues.push('Aucune image')
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * Validate batch of products
   */
  validateProducts(products: StandardProduct[]): {
    valid: StandardProduct[]
    invalid: Array<{ product: StandardProduct; issues: string[] }>
  } {
    const valid: StandardProduct[] = []
    const invalid: Array<{ product: StandardProduct; issues: string[] }> = []

    products.forEach(product => {
      const validation = this.validateProduct(product)
      if (validation.valid) {
        valid.push(product)
      } else {
        invalid.push({ product, issues: validation.issues })
      }
    })

    return { valid, invalid }
  }
}

export const supplierDataMapper = SupplierDataMapper.getInstance()
