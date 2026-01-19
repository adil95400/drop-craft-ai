/**
 * Hook pour le scoring d'audit des produits
 * Calcule un score de qualité global et par catégorie
 */

import { useMemo } from 'react'
import { UnifiedProduct, useUnifiedProducts } from './useUnifiedProducts'

export interface ProductScore {
  product: UnifiedProduct
  globalScore: number
  scores: {
    title: number
    description: number
    images: number
    price: number
    attributes: number
    seo: number
  }
  issues: ProductIssue[]
  recommendations: string[]
}

export interface ProductIssue {
  type: 'error' | 'warning' | 'info'
  category: 'title' | 'description' | 'images' | 'price' | 'attributes' | 'seo'
  message: string
  impact: number // 0-10
}

export interface AuditScoreStats {
  totalProducts: number
  averageScore: number
  excellentCount: number  // >= 80
  goodCount: number       // 60-79
  needsWorkCount: number  // 40-59
  poorCount: number       // < 40
  categoryAverages: {
    title: number
    description: number
    images: number
    price: number
    attributes: number
    seo: number
  }
  topIssues: { message: string; count: number; type: string }[]
}

function calculateProductScore(product: UnifiedProduct): ProductScore {
  const issues: ProductIssue[] = []
  const recommendations: string[] = []
  
  // Title Score (0-100)
  let titleScore = 100
  const titleLength = product.name?.length || 0
  
  if (!product.name) {
    titleScore = 0
    issues.push({ type: 'error', category: 'title', message: 'Titre manquant', impact: 10 })
  } else if (titleLength < 20) {
    titleScore = 30
    issues.push({ type: 'error', category: 'title', message: 'Titre trop court (< 20 caractères)', impact: 7 })
    recommendations.push('Allongez le titre avec marque + caractéristiques principales')
  } else if (titleLength < 40) {
    titleScore = 60
    issues.push({ type: 'warning', category: 'title', message: 'Titre court (< 40 caractères)', impact: 4 })
  } else if (titleLength > 150) {
    titleScore = 70
    issues.push({ type: 'warning', category: 'title', message: 'Titre trop long (> 150 caractères)', impact: 3 })
  } else if (titleLength > 70 && titleLength <= 100) {
    titleScore = 100 // Optimal
  } else if (titleLength > 100) {
    titleScore = 85
  }

  // Description Score (0-100)
  let descriptionScore = 100
  const descLength = product.description?.length || 0
  
  if (!product.description) {
    descriptionScore = 0
    issues.push({ type: 'error', category: 'description', message: 'Description manquante', impact: 10 })
    recommendations.push('Ajoutez une description détaillée avec mots-clés pertinents')
  } else if (descLength < 50) {
    descriptionScore = 20
    issues.push({ type: 'error', category: 'description', message: 'Description trop courte (< 50 caractères)', impact: 8 })
  } else if (descLength < 150) {
    descriptionScore = 50
    issues.push({ type: 'warning', category: 'description', message: 'Description courte (< 150 caractères)', impact: 5 })
    recommendations.push('Enrichissez la description avec caractéristiques et bénéfices')
  } else if (descLength < 300) {
    descriptionScore = 75
    issues.push({ type: 'info', category: 'description', message: 'Description moyenne (< 300 caractères)', impact: 2 })
  }

  // Images Score (0-100)
  let imagesScore = 100
  const imagesCount = product.images?.length || (product.image_url ? 1 : 0)
  
  if (imagesCount === 0) {
    imagesScore = 0
    issues.push({ type: 'error', category: 'images', message: 'Aucune image', impact: 10 })
    recommendations.push('Ajoutez au moins 3 images de haute qualité')
  } else if (imagesCount === 1) {
    imagesScore = 40
    issues.push({ type: 'warning', category: 'images', message: 'Une seule image', impact: 6 })
    recommendations.push('Ajoutez plusieurs angles et contextes d\'utilisation')
  } else if (imagesCount < 3) {
    imagesScore = 70
    issues.push({ type: 'info', category: 'images', message: 'Peu d\'images (< 3)', impact: 3 })
  }

  // Price Score (0-100)
  let priceScore = 100
  
  if (!product.price || product.price <= 0) {
    priceScore = 0
    issues.push({ type: 'error', category: 'price', message: 'Prix manquant ou invalide', impact: 10 })
  } else if (!product.cost_price) {
    priceScore = 70
    issues.push({ type: 'info', category: 'price', message: 'Prix de revient non renseigné', impact: 2 })
  } else {
    const margin = ((product.price - product.cost_price) / product.price) * 100
    if (margin < 10) {
      priceScore = 50
      issues.push({ type: 'warning', category: 'price', message: 'Marge faible (< 10%)', impact: 5 })
    } else if (margin < 20) {
      priceScore = 80
      issues.push({ type: 'info', category: 'price', message: 'Marge correcte (10-20%)', impact: 1 })
    }
  }

  // Attributes Score (0-100)
  let attributesScore = 100
  
  if (!product.sku) {
    attributesScore -= 25
    issues.push({ type: 'warning', category: 'attributes', message: 'SKU manquant', impact: 4 })
  }
  if (!product.category) {
    attributesScore -= 25
    issues.push({ type: 'warning', category: 'attributes', message: 'Catégorie manquante', impact: 4 })
    recommendations.push('Assignez une catégorie pour améliorer la découvrabilité')
  }
  if (product.stock_quantity === undefined || product.stock_quantity === null) {
    attributesScore -= 25
    issues.push({ type: 'info', category: 'attributes', message: 'Stock non renseigné', impact: 2 })
  }
  attributesScore = Math.max(0, attributesScore)

  // SEO Score (0-100)
  let seoScore = 100
  
  // Check title SEO
  const hasKeywords = product.name && product.name.split(' ').length >= 3
  if (!hasKeywords) {
    seoScore -= 20
    issues.push({ type: 'warning', category: 'seo', message: 'Titre avec peu de mots-clés', impact: 4 })
  }
  
  // Check description SEO
  if (!product.description || product.description.length < 150) {
    seoScore -= 30
  }
  
  // Check if has all mandatory fields
  if (!product.category) {
    seoScore -= 20
    issues.push({ type: 'warning', category: 'seo', message: 'Catégorie non définie pour le SEO', impact: 4 })
  }
  
  if (imagesCount === 0) {
    seoScore -= 30
    issues.push({ type: 'error', category: 'seo', message: 'Aucune image pour le référencement', impact: 7 })
  }
  
  seoScore = Math.max(0, seoScore)

  // Calculate global score (weighted average)
  const globalScore = Math.round(
    titleScore * 0.20 +
    descriptionScore * 0.25 +
    imagesScore * 0.20 +
    priceScore * 0.10 +
    attributesScore * 0.10 +
    seoScore * 0.15
  )

  return {
    product,
    globalScore,
    scores: {
      title: titleScore,
      description: descriptionScore,
      images: imagesScore,
      price: priceScore,
      attributes: attributesScore,
      seo: seoScore
    },
    issues,
    recommendations
  }
}

export function useAuditScoring() {
  const { products, isLoading, error, refetch } = useUnifiedProducts()

  const scoredProducts = useMemo(() => {
    return products.map(calculateProductScore).sort((a, b) => a.globalScore - b.globalScore)
  }, [products])

  const stats = useMemo((): AuditScoreStats => {
    if (scoredProducts.length === 0) {
      return {
        totalProducts: 0,
        averageScore: 0,
        excellentCount: 0,
        goodCount: 0,
        needsWorkCount: 0,
        poorCount: 0,
        categoryAverages: { title: 0, description: 0, images: 0, price: 0, attributes: 0, seo: 0 },
        topIssues: []
      }
    }

    const avgScore = Math.round(
      scoredProducts.reduce((sum, p) => sum + p.globalScore, 0) / scoredProducts.length
    )

    const excellent = scoredProducts.filter(p => p.globalScore >= 80)
    const good = scoredProducts.filter(p => p.globalScore >= 60 && p.globalScore < 80)
    const needsWork = scoredProducts.filter(p => p.globalScore >= 40 && p.globalScore < 60)
    const poor = scoredProducts.filter(p => p.globalScore < 40)

    // Calculate category averages
    const categoryAverages = {
      title: Math.round(scoredProducts.reduce((sum, p) => sum + p.scores.title, 0) / scoredProducts.length),
      description: Math.round(scoredProducts.reduce((sum, p) => sum + p.scores.description, 0) / scoredProducts.length),
      images: Math.round(scoredProducts.reduce((sum, p) => sum + p.scores.images, 0) / scoredProducts.length),
      price: Math.round(scoredProducts.reduce((sum, p) => sum + p.scores.price, 0) / scoredProducts.length),
      attributes: Math.round(scoredProducts.reduce((sum, p) => sum + p.scores.attributes, 0) / scoredProducts.length),
      seo: Math.round(scoredProducts.reduce((sum, p) => sum + p.scores.seo, 0) / scoredProducts.length)
    }

    // Aggregate top issues
    const issueCount = new Map<string, { count: number; type: string }>()
    scoredProducts.forEach(p => {
      p.issues.forEach(issue => {
        const existing = issueCount.get(issue.message)
        if (existing) {
          existing.count++
        } else {
          issueCount.set(issue.message, { count: 1, type: issue.type })
        }
      })
    })

    const topIssues = Array.from(issueCount.entries())
      .map(([message, data]) => ({ message, count: data.count, type: data.type }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalProducts: scoredProducts.length,
      averageScore: avgScore,
      excellentCount: excellent.length,
      goodCount: good.length,
      needsWorkCount: needsWork.length,
      poorCount: poor.length,
      categoryAverages,
      topIssues
    }
  }, [scoredProducts])

  return {
    scoredProducts,
    stats,
    isLoading,
    error,
    refetch
  }
}


