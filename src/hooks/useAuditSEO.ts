/**
 * Hook pour l'audit SEO des produits
 * Analyse les métadonnées, titres, descriptions pour le référencement
 */

import { useMemo, useState } from 'react'
import { UnifiedProduct, useUnifiedProducts } from './useUnifiedProducts'

export interface SEOAnalysis {
  product: UnifiedProduct
  seoScore: number
  metrics: {
    titleOptimization: { score: number; status: 'good' | 'warning' | 'error'; details: string }
    descriptionOptimization: { score: number; status: 'good' | 'warning' | 'error'; details: string }
    keywordDensity: { score: number; status: 'good' | 'warning' | 'error'; details: string }
    imageAlt: { score: number; status: 'good' | 'warning' | 'error'; details: string }
    urlStructure: { score: number; status: 'good' | 'warning' | 'error'; details: string }
    categoryMapping: { score: number; status: 'good' | 'warning' | 'error'; details: string }
  }
  issues: SEOIssue[]
  keywords: string[]
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  fixSuggestion: string
  affectedField: string
}

export interface SEOStats {
  totalProducts: number
  optimizedProducts: number
  partiallyOptimized: number
  needsOptimization: number
  averageSeoScore: number
  issueBreakdown: {
    titleIssues: number
    descriptionIssues: number
    keywordIssues: number
    imageIssues: number
    categoryIssues: number
  }
  topKeywords: { keyword: string; count: number }[]
}

function extractKeywords(text: string): string[] {
  if (!text) return []
  
  // Remove common French stop words
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'à', 'en', 'pour',
    'avec', 'sur', 'par', 'dans', 'ce', 'cette', 'ces', 'qui', 'que', 'est', 'sont',
    'the', 'a', 'an', 'and', 'or', 'for', 'with', 'on', 'by', 'in', 'is', 'are'
  ])
  
  return text
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüç-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
}

function analyzeSEO(product: UnifiedProduct): SEOAnalysis {
  const issues: SEOIssue[] = []
  
  // Title Optimization
  let titleScore = 100
  let titleStatus: 'good' | 'warning' | 'error' = 'good'
  let titleDetails = 'Titre bien optimisé'
  const titleLength = product.name?.length || 0
  
  if (!product.name) {
    titleScore = 0
    titleStatus = 'error'
    titleDetails = 'Titre manquant'
    issues.push({
      type: 'error',
      title: 'Titre manquant',
      description: 'Le produit n\'a pas de titre',
      fixSuggestion: 'Ajoutez un titre descriptif de 50-60 caractères',
      affectedField: 'title'
    })
  } else if (titleLength < 30) {
    titleScore = 40
    titleStatus = 'error'
    titleDetails = `Titre trop court (${titleLength} caractères)`
    issues.push({
      type: 'error',
      title: 'Titre trop court',
      description: 'Les titres courts réduisent le CTR et le référencement',
      fixSuggestion: 'Enrichissez avec marque, caractéristiques, couleur',
      affectedField: 'title'
    })
  } else if (titleLength < 50) {
    titleScore = 70
    titleStatus = 'warning'
    titleDetails = `Titre court (${titleLength} caractères)`
  } else if (titleLength > 100) {
    titleScore = 75
    titleStatus = 'warning'
    titleDetails = `Titre long (${titleLength} caractères)`
    issues.push({
      type: 'warning',
      title: 'Titre trop long',
      description: 'Risque de troncature dans les résultats de recherche',
      fixSuggestion: 'Réduisez à 60-70 caractères pour un affichage optimal',
      affectedField: 'title'
    })
  }

  // Description Optimization
  let descScore = 100
  let descStatus: 'good' | 'warning' | 'error' = 'good'
  let descDetails = 'Description bien optimisée'
  const descLength = product.description?.length || 0
  
  if (!product.description) {
    descScore = 0
    descStatus = 'error'
    descDetails = 'Description manquante'
    issues.push({
      type: 'error',
      title: 'Description manquante',
      description: 'Aucune description pour le référencement',
      fixSuggestion: 'Rédigez une description unique de 150-300 caractères',
      affectedField: 'description'
    })
  } else if (descLength < 100) {
    descScore = 30
    descStatus = 'error'
    descDetails = `Description trop courte (${descLength} caractères)`
    issues.push({
      type: 'error',
      title: 'Description trop courte',
      description: 'Contenu insuffisant pour le référencement',
      fixSuggestion: 'Ajoutez caractéristiques, bénéfices, cas d\'usage',
      affectedField: 'description'
    })
  } else if (descLength < 200) {
    descScore = 60
    descStatus = 'warning'
    descDetails = `Description courte (${descLength} caractères)`
  }

  // Keyword Density
  const titleKeywords = extractKeywords(product.name || '')
  const descKeywords = extractKeywords(product.description || '')
  const allKeywords = [...new Set([...titleKeywords, ...descKeywords])]
  
  let keywordScore = 100
  let keywordStatus: 'good' | 'warning' | 'error' = 'good'
  let keywordDetails = `${allKeywords.length} mots-clés détectés`
  
  if (allKeywords.length < 3) {
    keywordScore = 40
    keywordStatus = 'error'
    keywordDetails = 'Très peu de mots-clés'
    issues.push({
      type: 'warning',
      title: 'Peu de mots-clés',
      description: 'Le contenu manque de mots-clés pour le référencement',
      fixSuggestion: 'Intégrez des termes de recherche pertinents naturellement',
      affectedField: 'keywords'
    })
  } else if (allKeywords.length < 6) {
    keywordScore = 70
    keywordStatus = 'warning'
    keywordDetails = 'Densité de mots-clés moyenne'
  }

  // Image Alt (check if images exist)
  const imagesCount = product.images?.length || (product.image_url ? 1 : 0)
  let imageScore = 100
  let imageStatus: 'good' | 'warning' | 'error' = 'good'
  let imageDetails = 'Images présentes'
  
  if (imagesCount === 0) {
    imageScore = 0
    imageStatus = 'error'
    imageDetails = 'Aucune image'
    issues.push({
      type: 'error',
      title: 'Images manquantes',
      description: 'Aucune image pour le produit',
      fixSuggestion: 'Ajoutez au moins 3 images avec attributs alt descriptifs',
      affectedField: 'images'
    })
  } else if (imagesCount === 1) {
    imageScore = 50
    imageStatus = 'warning'
    imageDetails = 'Une seule image'
  }

  // URL Structure (simulated based on SKU)
  let urlScore = 100
  let urlStatus: 'good' | 'warning' | 'error' = 'good'
  let urlDetails = 'Structure URL correcte'
  
  if (!product.sku) {
    urlScore = 70
    urlStatus = 'warning'
    urlDetails = 'SKU manquant pour URL canonique'
    issues.push({
      type: 'info',
      title: 'SKU non défini',
      description: 'Le SKU aide à créer des URLs uniques',
      fixSuggestion: 'Définissez un SKU unique pour chaque produit',
      affectedField: 'sku'
    })
  }

  // Category Mapping
  let categoryScore = 100
  let categoryStatus: 'good' | 'warning' | 'error' = 'good'
  let categoryDetails = 'Catégorie définie'
  
  if (!product.category) {
    categoryScore = 0
    categoryStatus = 'error'
    categoryDetails = 'Catégorie manquante'
    issues.push({
      type: 'error',
      title: 'Catégorie non définie',
      description: 'Crucial pour Google Shopping et la navigation',
      fixSuggestion: 'Assignez une catégorie Google Product Category',
      affectedField: 'category'
    })
  }

  // Calculate overall SEO score
  const seoScore = Math.round(
    titleScore * 0.25 +
    descScore * 0.25 +
    keywordScore * 0.15 +
    imageScore * 0.15 +
    urlScore * 0.10 +
    categoryScore * 0.10
  )

  return {
    product,
    seoScore,
    metrics: {
      titleOptimization: { score: titleScore, status: titleStatus, details: titleDetails },
      descriptionOptimization: { score: descScore, status: descStatus, details: descDetails },
      keywordDensity: { score: keywordScore, status: keywordStatus, details: keywordDetails },
      imageAlt: { score: imageScore, status: imageStatus, details: imageDetails },
      urlStructure: { score: urlScore, status: urlStatus, details: urlDetails },
      categoryMapping: { score: categoryScore, status: categoryStatus, details: categoryDetails }
    },
    issues,
    keywords: allKeywords.slice(0, 10)
  }
}

export function useAuditSEO() {
  const { products, isLoading, error, refetch } = useUnifiedProducts()
  const [searchQuery, setSearchQuery] = useState('')

  const seoAnalyses = useMemo(() => {
    let analyses = products.map(analyzeSEO)
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      analyses = analyses.filter(a => 
        a.product.name?.toLowerCase().includes(query) ||
        a.product.sku?.toLowerCase().includes(query)
      )
    }
    
    return analyses.sort((a, b) => a.seoScore - b.seoScore) // Worst first
  }, [products, searchQuery])

  const stats = useMemo((): SEOStats => {
    if (seoAnalyses.length === 0) {
      return {
        totalProducts: 0,
        optimizedProducts: 0,
        partiallyOptimized: 0,
        needsOptimization: 0,
        averageSeoScore: 0,
        issueBreakdown: {
          titleIssues: 0,
          descriptionIssues: 0,
          keywordIssues: 0,
          imageIssues: 0,
          categoryIssues: 0
        },
        topKeywords: []
      }
    }

    const avgScore = Math.round(
      seoAnalyses.reduce((sum, a) => sum + a.seoScore, 0) / seoAnalyses.length
    )

    const optimized = seoAnalyses.filter(a => a.seoScore >= 80).length
    const partial = seoAnalyses.filter(a => a.seoScore >= 50 && a.seoScore < 80).length
    const needs = seoAnalyses.filter(a => a.seoScore < 50).length

    // Issue breakdown
    const issueBreakdown = {
      titleIssues: seoAnalyses.filter(a => a.metrics.titleOptimization.status !== 'good').length,
      descriptionIssues: seoAnalyses.filter(a => a.metrics.descriptionOptimization.status !== 'good').length,
      keywordIssues: seoAnalyses.filter(a => a.metrics.keywordDensity.status !== 'good').length,
      imageIssues: seoAnalyses.filter(a => a.metrics.imageAlt.status !== 'good').length,
      categoryIssues: seoAnalyses.filter(a => a.metrics.categoryMapping.status !== 'good').length
    }

    // Top keywords across all products
    const keywordCount = new Map<string, number>()
    seoAnalyses.forEach(a => {
      a.keywords.forEach(keyword => {
        keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1)
      })
    })
    
    const topKeywords = Array.from(keywordCount.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    return {
      totalProducts: seoAnalyses.length,
      optimizedProducts: optimized,
      partiallyOptimized: partial,
      needsOptimization: needs,
      averageSeoScore: avgScore,
      issueBreakdown,
      topKeywords
    }
  }, [seoAnalyses])

  return {
    seoAnalyses,
    stats,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery
  }
}
