/**
 * AUTO-FIX ENGINE
 * Système de correction automatique des produits
 * Détecte les problèmes via auditProduct et applique des corrections automatiques
 */

import { UnifiedProduct } from '@/services/ProductsUnifiedService'
import { auditProduct } from './auditProduct'
import { ProductAuditIssue } from '@/types/audit'

export interface AutoFixOptions {
  useAI?: boolean
  aiService?: any // ProductAIService instance
  maxRetries?: number
  dryRun?: boolean
}

export interface AutoFixResult {
  success: boolean
  fixed: UnifiedProduct
  appliedFixes: Array<{
    issue: ProductAuditIssue
    action: string
    field: string
    before: any
    after: any
  }>
  remainingIssues: ProductAuditIssue[]
  error?: string
}

/**
 * Correction automatique d'un produit
 */
export async function autoFixProduct(
  product: UnifiedProduct,
  options: AutoFixOptions = {}
): Promise<AutoFixResult> {
  const { useAI = false, aiService, dryRun = false } = options
  
  // Audit initial
  const auditResult = auditProduct(product)
  let fixedProduct = { ...product }
  const appliedFixes: AutoFixResult['appliedFixes'] = []
  
  try {
    // Trier les issues par gravité (critical d'abord)
    const sortedIssues = [...auditResult.issues].sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
    
    for (const issue of sortedIssues) {
      const fix = await applyFix(fixedProduct, issue, { useAI, aiService })
      
      if (fix.success) {
        appliedFixes.push({
          issue,
          action: fix.action,
          field: fix.field,
          before: fix.before,
          after: fix.after
        })
        fixedProduct = fix.product
      }
    }
    
    // Audit final pour vérifier les issues restantes
    const finalAudit = auditProduct(fixedProduct)
    
    return {
      success: true,
      fixed: dryRun ? product : fixedProduct,
      appliedFixes,
      remainingIssues: finalAudit.issues
    }
    
  } catch (error) {
    return {
      success: false,
      fixed: product,
      appliedFixes,
      remainingIssues: auditResult.issues,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Applique une correction spécifique pour une issue
 */
async function applyFix(
  product: UnifiedProduct,
  issue: ProductAuditIssue,
  options: { useAI?: boolean; aiService?: any }
): Promise<{
  success: boolean
  product: UnifiedProduct
  action: string
  field: string
  before: any
  after: any
}> {
  const fixed = { ...product }
  
  // Corrections directes (sans IA)
  switch (issue.id) {
    case 'empty_title':
      if (!product.name) {
        fixed.name = generateFallbackTitle(product)
        return {
          success: true,
          product: fixed,
          action: 'generated_fallback_title',
          field: 'name',
          before: product.name,
          after: fixed.name
        }
      }
      break
      
    case 'title_too_short':
      if (product.name && product.name.length < 20 && options.useAI && options.aiService) {
        try {
          const aiTitle = await options.aiService.generateTitle(product, { mode: 'seo' })
          fixed.name = aiTitle
          return {
            success: true,
            product: fixed,
            action: 'ai_generated_title',
            field: 'name',
            before: product.name,
            after: aiTitle
          }
        } catch (e) {
          // Fallback sans IA
          fixed.name = `${product.name} - ${product.category || 'Product'}`
          return {
            success: true,
            product: fixed,
            action: 'extended_title',
            field: 'name',
            before: product.name,
            after: fixed.name
          }
        }
      }
      break
      
    case 'description_empty':
      if (!product.description) {
        if (options.useAI && options.aiService) {
          try {
            const aiDescription = await options.aiService.generateDescription(product)
            fixed.description = aiDescription
            return {
              success: true,
              product: fixed,
              action: 'ai_generated_description',
              field: 'description',
              before: product.description,
              after: aiDescription
            }
          } catch (e) {
            // Fallback
            fixed.description = generateFallbackDescription(product)
            return {
              success: true,
              product: fixed,
              action: 'generated_fallback_description',
              field: 'description',
              before: product.description,
              after: fixed.description
            }
          }
        } else {
          fixed.description = generateFallbackDescription(product)
          return {
            success: true,
            product: fixed,
            action: 'generated_fallback_description',
            field: 'description',
            before: product.description,
            after: fixed.description
          }
        }
      }
      break
      
    case 'description_too_short':
      if (product.description && product.description.length < 100 && options.useAI && options.aiService) {
        try {
          const aiDescription = await options.aiService.generateDescription(product)
          fixed.description = aiDescription
          return {
            success: true,
            product: fixed,
            action: 'ai_expanded_description',
            field: 'description',
            before: product.description,
            after: aiDescription
          }
        } catch (e) {
          // Fallback: ajouter des informations basiques
          fixed.description = `${product.description}\n\nCaractéristiques:\n- Prix: ${product.price}€\n- Catégorie: ${product.category || 'Non spécifié'}\n- ${product.stock_quantity ? `En stock: ${product.stock_quantity} unités` : 'Stock à vérifier'}`
          return {
            success: true,
            product: fixed,
            action: 'extended_description',
            field: 'description',
            before: product.description,
            after: fixed.description
          }
        }
      }
      break
      
    case 'missing_sku':
      if (!product.sku) {
        fixed.sku = generateSKU(product)
        return {
          success: true,
          product: fixed,
          action: 'generated_sku',
          field: 'sku',
          before: product.sku,
          after: fixed.sku
        }
      }
      break
      
    case 'missing_category':
      if (!product.category && options.useAI && options.aiService) {
        try {
          const aiCategory = await options.aiService.categorizeProduct(product)
          fixed.category = aiCategory
          return {
            success: true,
            product: fixed,
            action: 'ai_categorized',
            field: 'category',
            before: product.category,
            after: aiCategory
          }
        } catch (e) {
          fixed.category = 'Non classé'
          return {
            success: true,
            product: fixed,
            action: 'default_category',
            field: 'category',
            before: product.category,
            after: fixed.category
          }
        }
      }
      break
      
    case 'no_images':
      // Pas de correction automatique possible sans image source
      return {
        success: false,
        product,
        action: 'no_action_available',
        field: 'images',
        before: product.images,
        after: product.images
      }
      
    case 'missing_meta_title':
      // Note: UnifiedProduct n'a pas encore de champs SEO dédiés
      // On pourrait utiliser 'metadata' ou ajouter ces champs plus tard
      // Pour l'instant, on skip cette correction
      return {
        success: false,
        product,
        action: 'field_not_supported',
        field: 'seo_title',
        before: null,
        after: null
      }
      
    case 'missing_meta_description':
      // Note: UnifiedProduct n'a pas encore de champs SEO dédiés
      return {
        success: false,
        product,
        action: 'field_not_supported',
        field: 'seo_description',
        before: null,
        after: null
      }
      break
  }
  
  // Aucune correction disponible
  return {
    success: false,
    product,
    action: 'no_fix_available',
    field: issue.field || 'unknown',
    before: null,
    after: null
  }
}

/**
 * Utilitaires pour générer des valeurs par défaut
 */
function generateFallbackTitle(product: UnifiedProduct): string {
  if (product.category) {
    return `${product.category} ${product.sku || product.id.substring(0, 8)}`
  }
  return `Produit ${product.sku || product.id.substring(0, 8)}`
}

function generateFallbackDescription(product: UnifiedProduct): string {
  return `${product.name || 'Ce produit'} est disponible au prix de ${product.price}€. ${
    product.category ? `Catégorie: ${product.category}.` : ''
  } ${product.stock_quantity ? `En stock: ${product.stock_quantity} unités disponibles.` : ''}`
}

function generateSKU(product: UnifiedProduct): string {
  const prefix = product.category?.substring(0, 3).toUpperCase() || 'PRD'
  const timestamp = Date.now().toString(36).toUpperCase()
  return `${prefix}-${timestamp}`
}

/**
 * Correction en masse de produits critiques
 */
export async function autoFixCriticalProducts(
  products: UnifiedProduct[],
  options: AutoFixOptions = {}
): Promise<{
  totalProcessed: number
  totalFixed: number
  results: AutoFixResult[]
}> {
  const results: AutoFixResult[] = []
  let totalFixed = 0
  
  for (const product of products) {
    const audit = auditProduct(product)
    const hasCritical = audit.issues.some(i => i.severity === 'critical')
    
    if (hasCritical) {
      const result = await autoFixProduct(product, options)
      results.push(result)
      if (result.success && result.appliedFixes.length > 0) {
        totalFixed++
      }
    }
  }
  
  return {
    totalProcessed: results.length,
    totalFixed,
    results
  }
}