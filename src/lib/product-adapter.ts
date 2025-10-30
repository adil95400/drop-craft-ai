/**
 * Adaptateur pour transformer les produits selon les specs de chaque plateforme
 */

import { PlatformConfig } from './platform-configs'

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface AdaptedProduct {
  original: any
  adapted: Record<string, any>
  warnings: ValidationError[]
  errors: ValidationError[]
  isValid: boolean
}

export class ProductAdapter {
  private config: PlatformConfig
  
  constructor(platformConfig: PlatformConfig) {
    this.config = platformConfig
  }

  /**
   * Adapte un produit aux specs de la plateforme
   */
  adapt(product: any): AdaptedProduct {
    const warnings: ValidationError[] = []
    const errors: ValidationError[] = []
    const adapted: Record<string, any> = {}

    // Adapter le titre
    const titleResult = this.adaptTitle(product.name || product.title)
    adapted.title = titleResult.value
    if (titleResult.warnings) warnings.push(...titleResult.warnings)
    if (titleResult.errors) errors.push(...titleResult.errors)

    // Adapter la description
    const descResult = this.adaptDescription(product.description)
    adapted.description = descResult.value
    if (descResult.warnings) warnings.push(...descResult.warnings)
    if (descResult.errors) errors.push(...descResult.errors)

    // Adapter les images
    const imagesResult = this.adaptImages(product.image_url, product.image_urls)
    adapted.images = imagesResult.value
    if (imagesResult.warnings) warnings.push(...imagesResult.warnings)
    if (imagesResult.errors) errors.push(...imagesResult.errors)

    // Adapter le prix
    const priceResult = this.adaptPrice(product.price, product.currency)
    adapted.price = priceResult.value
    adapted.currency = priceResult.currency
    if (priceResult.warnings) warnings.push(...priceResult.warnings)
    if (priceResult.errors) errors.push(...priceResult.errors)

    // Adapter les tags
    if (product.tags) {
      const tagsResult = this.adaptTags(product.tags)
      adapted.tags = tagsResult.value
      if (tagsResult.warnings) warnings.push(...tagsResult.warnings)
    }

    // Adapter le SKU
    if (product.sku) {
      const skuResult = this.adaptSKU(product.sku)
      adapted.sku = skuResult.value
      if (skuResult.warnings) warnings.push(...skuResult.warnings)
    }

    // Adapter la marque (brand)
    const brandResult = this.adaptBrand(product.brand || product.supplier_name)
    adapted.brand = brandResult.value
    if (brandResult.warnings) warnings.push(...brandResult.warnings)
    if (brandResult.errors) errors.push(...brandResult.errors)

    // Adapter la catégorie
    const categoryResult = this.adaptCategory(product.category)
    adapted.category = categoryResult.value
    if (categoryResult.warnings) warnings.push(...categoryResult.warnings)
    if (categoryResult.errors) errors.push(...categoryResult.errors)

    // Adapter le stock/inventaire
    const stockResult = this.adaptStock(product.stock_quantity || product.inventory_quantity)
    adapted.inventory_quantity = stockResult.value
    adapted.stock_status = stockResult.status
    if (stockResult.warnings) warnings.push(...stockResult.warnings)
    if (stockResult.errors) errors.push(...stockResult.errors)
    
    // Champs custom par plateforme
    if (this.config.customFields) {
      Object.keys(this.config.customFields).forEach(field => {
        if (product[field] !== undefined) {
          adapted[field] = product[field]
        }
      })
    }

    return {
      original: product,
      adapted,
      warnings,
      errors,
      isValid: errors.length === 0
    }
  }

  private adaptTitle(title: string): { value: string; warnings?: ValidationError[]; errors?: ValidationError[] } {
    const warnings: ValidationError[] = []
    const errors: ValidationError[] = []
    let value = title || ''

    // Vérifier la longueur minimale
    if (value.length < this.config.title.minLength) {
      if (this.config.title.required) {
        errors.push({
          field: 'title',
          message: `Le titre doit contenir au moins ${this.config.title.minLength} caractères`,
          severity: 'error'
        })
      }
    }

    // Tronquer si trop long
    if (value.length > this.config.title.maxLength) {
      warnings.push({
        field: 'title',
        message: `Le titre a été tronqué de ${value.length} à ${this.config.title.maxLength} caractères`,
        severity: 'warning'
      })
      value = value.substring(0, this.config.title.maxLength)
    }

    // Vérifier les mots interdits
    if (this.config.title.forbidden) {
      const lowerValue = value.toLowerCase()
      this.config.title.forbidden.forEach(word => {
        if (lowerValue.includes(word.toLowerCase())) {
          warnings.push({
            field: 'title',
            message: `Le mot "${word}" est interdit sur ${this.config.name}`,
            severity: 'warning'
          })
        }
      })
    }

    return { value, warnings: warnings.length > 0 ? warnings : undefined, errors: errors.length > 0 ? errors : undefined }
  }

  private adaptDescription(description: string): { value: string; warnings?: ValidationError[]; errors?: ValidationError[] } {
    const warnings: ValidationError[] = []
    const errors: ValidationError[] = []
    let value = description || ''

    // Retirer le HTML si non supporté
    if (!this.config.description.allowsHTML && value.includes('<')) {
      value = value.replace(/<[^>]*>/g, '')
      warnings.push({
        field: 'description',
        message: 'Le HTML a été retiré car non supporté par cette plateforme',
        severity: 'warning'
      })
    }

    // Vérifier longueur minimale
    if (value.length < this.config.description.minLength && this.config.description.required) {
      errors.push({
        field: 'description',
        message: `La description doit contenir au moins ${this.config.description.minLength} caractères`,
        severity: 'error'
      })
    }

    // Tronquer si trop long
    if (value.length > this.config.description.maxLength) {
      warnings.push({
        field: 'description',
        message: `La description a été tronquée de ${value.length} à ${this.config.description.maxLength} caractères`,
        severity: 'warning'
      })
      value = value.substring(0, this.config.description.maxLength)
    }

    return { value, warnings: warnings.length > 0 ? warnings : undefined, errors: errors.length > 0 ? errors : undefined }
  }

  private adaptImages(mainImage?: string, additionalImages?: string[]): { value: string[]; warnings?: ValidationError[]; errors?: ValidationError[] } {
    const warnings: ValidationError[] = []
    const errors: ValidationError[] = []
    const images: string[] = []

    if (mainImage) images.push(mainImage)
    if (additionalImages) images.push(...additionalImages)

    // Vérifier le nombre minimum d'images
    if (images.length < this.config.images.minCount) {
      errors.push({
        field: 'images',
        message: `Au moins ${this.config.images.minCount} image(s) requise(s)`,
        severity: 'error'
      })
    }

    // Limiter le nombre d'images
    if (images.length > this.config.images.maxCount) {
      warnings.push({
        field: 'images',
        message: `Seulement les ${this.config.images.maxCount} premières images seront utilisées`,
        severity: 'warning'
      })
      images.splice(this.config.images.maxCount)
    }

    return { value: images, warnings: warnings.length > 0 ? warnings : undefined, errors: errors.length > 0 ? errors : undefined }
  }

  private adaptPrice(price: number, currency?: string): { value: number; currency: string; warnings?: ValidationError[]; errors?: ValidationError[] } {
    const warnings: ValidationError[] = []
    const errors: ValidationError[] = []
    
    // Vérifier le prix minimum
    if (this.config.pricing.minPrice && price < this.config.pricing.minPrice) {
      errors.push({
        field: 'price',
        message: `Le prix minimum sur ${this.config.name} est ${this.config.pricing.minPrice}`,
        severity: 'error'
      })
    }

    // Vérifier le prix maximum
    if (this.config.pricing.maxPrice && price > this.config.pricing.maxPrice) {
      errors.push({
        field: 'price',
        message: `Le prix maximum sur ${this.config.name} est ${this.config.pricing.maxPrice}`,
        severity: 'error'
      })
    }

    // Vérifier la devise
    const useCurrency = currency || 'EUR'
    if (!this.config.pricing.currency.includes(useCurrency)) {
      warnings.push({
        field: 'currency',
        message: `La devise ${useCurrency} n'est pas supportée. Utilisation de ${this.config.pricing.currency[0]}`,
        severity: 'warning'
      })
      return { 
        value: price, 
        currency: this.config.pricing.currency[0],
        warnings,
        errors: errors.length > 0 ? errors : undefined
      }
    }

    return { value: price, currency: useCurrency, warnings: warnings.length > 0 ? warnings : undefined, errors: errors.length > 0 ? errors : undefined }
  }

  private adaptTags(tags: string[]): { value: string[]; warnings?: ValidationError[] } {
    const warnings: ValidationError[] = []
    let value = [...tags]

    if (this.config.limits?.tags && value.length > this.config.limits.tags) {
      warnings.push({
        field: 'tags',
        message: `Seulement ${this.config.limits.tags} tags maximum. Les tags en excès ont été retirés.`,
        severity: 'warning'
      })
      value = value.slice(0, this.config.limits.tags)
    }

    return { value, warnings: warnings.length > 0 ? warnings : undefined }
  }

  private adaptSKU(sku: string): { value: string; warnings?: ValidationError[] } {
    const warnings: ValidationError[] = []
    let value = sku

    if (this.config.limits?.skuLength && value.length > this.config.limits.skuLength) {
      warnings.push({
        field: 'sku',
        message: `Le SKU a été tronqué à ${this.config.limits.skuLength} caractères`,
        severity: 'warning'
      })
      value = value.substring(0, this.config.limits.skuLength)
    }

    return { value, warnings: warnings.length > 0 ? warnings : undefined }
  }

  private adaptBrand(brand?: string): { value: string; warnings?: ValidationError[]; errors?: ValidationError[] } {
    const warnings: ValidationError[] = []
    const errors: ValidationError[] = []
    let value = brand || ''

    // Vérifier si la marque est requise
    const brandRequired = this.config.requiredFields.includes('brand')
    
    if (!value && brandRequired) {
      errors.push({
        field: 'brand',
        message: `La marque est obligatoire sur ${this.config.name}`,
        severity: 'error'
      })
    }

    // Limiter la longueur si nécessaire
    if (value.length > 100) {
      warnings.push({
        field: 'brand',
        message: 'La marque a été tronquée à 100 caractères',
        severity: 'warning'
      })
      value = value.substring(0, 100)
    }

    return { value, warnings: warnings.length > 0 ? warnings : undefined, errors: errors.length > 0 ? errors : undefined }
  }

  private adaptCategory(category?: string): { value: string; warnings?: ValidationError[]; errors?: ValidationError[] } {
    const warnings: ValidationError[] = []
    const errors: ValidationError[] = []
    let value = category || ''

    // Vérifier si la catégorie est requise
    const categoryRequired = this.config.requiredFields.includes('category')
    
    if (!value && categoryRequired) {
      errors.push({
        field: 'category',
        message: `La catégorie est obligatoire sur ${this.config.name}`,
        severity: 'error'
      })
    }

    // Vérifier le mapping de catégories si nécessaire
    if (this.config.categories?.mappingRequired && value) {
      warnings.push({
        field: 'category',
        message: 'Assurez-vous que la catégorie correspond aux catégories de la plateforme',
        severity: 'warning'
      })
    }

    return { value, warnings: warnings.length > 0 ? warnings : undefined, errors: errors.length > 0 ? errors : undefined }
  }

  private adaptStock(stock?: number): { value: number; status: string; warnings?: ValidationError[]; errors?: ValidationError[] } {
    const warnings: ValidationError[] = []
    const errors: ValidationError[] = []
    let value = stock || 0

    // Vérifier stock négatif
    if (value < 0) {
      warnings.push({
        field: 'stock',
        message: 'Le stock ne peut pas être négatif, ajusté à 0',
        severity: 'warning'
      })
      value = 0
    }

    // Déterminer le statut du stock
    let status = 'in_stock'
    if (value === 0) {
      status = 'out_of_stock'
      warnings.push({
        field: 'stock',
        message: 'Produit en rupture de stock',
        severity: 'warning'
      })
    } else if (value < 10) {
      status = 'low_stock'
      warnings.push({
        field: 'stock',
        message: 'Stock faible (moins de 10 unités)',
        severity: 'warning'
      })
    }

    return { 
      value, 
      status,
      warnings: warnings.length > 0 ? warnings : undefined, 
      errors: errors.length > 0 ? errors : undefined 
    }
  }

  /**
   * Valide un produit sans l'adapter
   */
  validate(product: any): { isValid: boolean; errors: ValidationError[]; warnings: ValidationError[] } {
    const result = this.adapt(product)
    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings
    }
  }
}
