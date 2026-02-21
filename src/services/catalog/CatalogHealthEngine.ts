/**
 * CatalogHealthEngine — Enterprise-grade weighted quality scoring
 * 
 * 6 pillars aligned with marketplace best practices:
 * - Title (20%): length, keywords, formatting
 * - Description (20%): richness, structure, HTML quality
 * - Images (20%): count, main image presence, variety
 * - Price & Stock (15%): pricing set, margin, availability
 * - Identifiers (15%): SKU, barcode/EAN, category, brand
 * - SEO (10%): meta title, meta description, keywords, slug
 */

export interface HealthPillar {
  key: string
  label: string
  score: number
  weight: number
  weightedScore: number
  issues: HealthIssue[]
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

export interface HealthIssue {
  pillar: string
  severity: 'error' | 'warning' | 'info'
  message: string
  fixable: boolean
  autoFixAction?: string
}

export interface ProductHealthReport {
  productId: string
  globalScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  status: 'excellent' | 'good' | 'warning' | 'critical'
  pillars: HealthPillar[]
  issues: HealthIssue[]
  recommendations: string[]
  analyzedAt: string
}

export interface CatalogHealthSummary {
  totalProducts: number
  averageScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  distribution: { excellent: number; good: number; warning: number; critical: number }
  topIssues: { message: string; count: number; severity: string }[]
  pillarAverages: { key: string; label: string; avg: number }[]
  readinessPercent: number
}

// Pillar weights (must sum to 100)
const PILLAR_WEIGHTS = {
  title: 20,
  description: 20,
  images: 20,
  pricing: 15,
  identifiers: 15,
  seo: 10,
} as const

function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function statusFromScore(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'warning'
  return 'critical'
}

interface ProductData {
  id: string
  title?: string | null
  name?: string | null
  description?: string | null
  image_url?: string | null
  images?: string[] | null
  price?: number | null
  cost_price?: number | null
  stock_quantity?: number | null
  sku?: string | null
  barcode?: string | null
  category?: string | null
  brand?: string | null
  tags?: string[] | null
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string[] | null
  status?: string | null
}

function scoreTitle(p: ProductData): { score: number; issues: HealthIssue[] } {
  const title = p.title || p.name || ''
  const issues: HealthIssue[] = []
  let score = 0

  if (!title) {
    issues.push({ pillar: 'title', severity: 'error', message: 'Titre manquant', fixable: true, autoFixAction: 'ai_generate_title' })
    return { score: 0, issues }
  }

  // Length (0-35pts)
  if (title.length >= 25 && title.length <= 80) score += 35
  else if (title.length < 25) {
    score += Math.round((title.length / 25) * 20)
    issues.push({ pillar: 'title', severity: 'warning', message: `Titre trop court (${title.length} car.)`, fixable: true, autoFixAction: 'ai_optimize_title' })
  } else {
    score += 25
    issues.push({ pillar: 'title', severity: 'info', message: `Titre long (${title.length} car.)`, fixable: true })
  }

  // Word count (0-25pts)
  const words = title.trim().split(/\s+/).length
  if (words >= 4 && words <= 12) score += 25
  else if (words < 4) {
    score += Math.round((words / 4) * 15)
    issues.push({ pillar: 'title', severity: 'warning', message: 'Titre trop peu de mots-clés', fixable: true })
  } else score += 20

  // Capitalization (0-15pts)
  if (/^[A-ZÀ-ÿ]/.test(title)) score += 15
  else issues.push({ pillar: 'title', severity: 'info', message: 'Titre ne commence pas par une majuscule', fixable: true })

  // No spam patterns (0-15pts)
  if (!/[!]{2,}|[A-Z]{10,}|FREE|BEST|CHEAP/i.test(title)) score += 15
  else issues.push({ pillar: 'title', severity: 'warning', message: 'Titre contient des patterns spam', fixable: true })

  // Special chars quality (0-10pts)
  if (!title.includes('  ') && !title.includes('???') && !title.includes('...')) score += 10

  return { score: Math.min(100, score), issues }
}

function scoreDescription(p: ProductData): { score: number; issues: HealthIssue[] } {
  const desc = (p.description || '').replace(/<[^>]*>/g, '').trim()
  const rawDesc = p.description || ''
  const issues: HealthIssue[] = []
  let score = 0

  if (!desc) {
    issues.push({ pillar: 'description', severity: 'error', message: 'Description manquante', fixable: true, autoFixAction: 'ai_generate_description' })
    return { score: 0, issues }
  }

  // Length (0-35pts)
  if (desc.length >= 150 && desc.length <= 2000) score += 35
  else if (desc.length < 150) {
    score += Math.round((desc.length / 150) * 20)
    issues.push({ pillar: 'description', severity: 'warning', message: `Description courte (${desc.length} car.)`, fixable: true, autoFixAction: 'ai_enrich_description' })
  } else score += 30

  // Word diversity (0-20pts)
  const wordCount = desc.split(/\s+/).length
  if (wordCount >= 30) score += 20
  else score += Math.round((wordCount / 30) * 15)

  // Has HTML structure (0-15pts) — indicates rich content
  if (/<(ul|ol|li|h[2-6]|strong|em|p)/.test(rawDesc)) score += 15
  else if (desc.length > 200) score += 8

  // Contains numbers/specs (0-15pts)
  if (/\d/.test(desc)) score += 10
  if (/\b(cm|mm|kg|g|ml|L|W|V)\b/i.test(desc)) score += 5

  // Ends properly (0-15pts)
  if (/[.!?]$/.test(desc)) score += 10
  else issues.push({ pillar: 'description', severity: 'info', message: 'Description sans ponctuation finale', fixable: true })

  // No duplicate content indicator
  if (desc !== (p.title || p.name || '')) score += 5
  else issues.push({ pillar: 'description', severity: 'warning', message: 'Description identique au titre', fixable: true })

  return { score: Math.min(100, score), issues }
}

function scoreImages(p: ProductData): { score: number; issues: HealthIssue[] } {
  const imageCount = (p.images?.length || 0) + (p.image_url && !p.images?.includes(p.image_url) ? 1 : 0)
  const issues: HealthIssue[] = []
  let score = 0

  if (imageCount === 0) {
    issues.push({ pillar: 'images', severity: 'error', message: 'Aucune image produit', fixable: false })
    return { score: 0, issues }
  }

  // At least 1 image (0-30pts)
  score += 30

  // 3+ images (0-30pts)
  if (imageCount >= 3) score += 30
  else {
    score += Math.round(((imageCount - 1) / 2) * 20)
    issues.push({ pillar: 'images', severity: 'warning', message: `Seulement ${imageCount} image(s) — 3+ recommandées`, fixable: false })
  }

  // 5+ images (0-20pts)
  if (imageCount >= 5) score += 20
  else if (imageCount >= 3) score += 10

  // Main image exists (0-20pts)
  if (p.image_url) score += 20
  else issues.push({ pillar: 'images', severity: 'warning', message: 'Image principale non définie', fixable: false })

  return { score: Math.min(100, score), issues }
}

function scorePricing(p: ProductData): { score: number; issues: HealthIssue[] } {
  const issues: HealthIssue[] = []
  let score = 0
  const price = p.price || 0
  const costPrice = p.cost_price || 0
  const stock = p.stock_quantity ?? -1

  // Has price (0-35pts)
  if (price > 0) score += 35
  else {
    issues.push({ pillar: 'pricing', severity: 'error', message: 'Prix de vente non défini', fixable: false })
    return { score: 0, issues }
  }

  // Has cost price / margin (0-25pts)
  if (costPrice > 0) {
    score += 15
    const margin = ((price - costPrice) / price) * 100
    if (margin >= 20) score += 10
    else issues.push({ pillar: 'pricing', severity: 'warning', message: `Marge faible (${margin.toFixed(0)}%)`, fixable: false })
  } else {
    issues.push({ pillar: 'pricing', severity: 'info', message: 'Prix d\'achat non renseigné', fixable: false })
  }

  // Stock (0-25pts)
  if (stock > 5) score += 25
  else if (stock > 0) {
    score += 15
    issues.push({ pillar: 'pricing', severity: 'warning', message: `Stock bas (${stock} unités)`, fixable: false })
  } else if (stock === 0) {
    issues.push({ pillar: 'pricing', severity: 'error', message: 'Rupture de stock', fixable: false })
  }
  // stock === -1 means unknown, give partial credit
  else score += 10

  // Active status (0-15pts)
  if (p.status === 'active') score += 15
  else if (p.status === 'draft') score += 5

  return { score: Math.min(100, score), issues }
}

function scoreIdentifiers(p: ProductData): { score: number; issues: HealthIssue[] } {
  const issues: HealthIssue[] = []
  let score = 0

  // SKU (0-30pts)
  if (p.sku && p.sku.trim().length > 0) score += 30
  else issues.push({ pillar: 'identifiers', severity: 'warning', message: 'SKU manquant', fixable: false })

  // Category (0-25pts)
  if (p.category) score += 25
  else issues.push({ pillar: 'identifiers', severity: 'warning', message: 'Catégorie non définie', fixable: true, autoFixAction: 'ai_categorize' })

  // Brand (0-20pts)
  if (p.brand) score += 20
  else issues.push({ pillar: 'identifiers', severity: 'info', message: 'Marque non renseignée', fixable: false })

  // Barcode/EAN (0-15pts)
  if (p.barcode) score += 15

  // Tags (0-10pts)
  if ((p.tags?.length || 0) >= 2) score += 10
  else if ((p.tags?.length || 0) > 0) score += 5

  return { score: Math.min(100, score), issues }
}

function scoreSEO(p: ProductData): { score: number; issues: HealthIssue[] } {
  const issues: HealthIssue[] = []
  let score = 0

  // SEO title (0-30pts)
  const seoTitle = p.seo_title || ''
  if (seoTitle.length >= 20 && seoTitle.length <= 60) score += 30
  else if (seoTitle.length > 0) {
    score += 15
    issues.push({ pillar: 'seo', severity: 'info', message: 'Titre SEO hors plage optimale (20-60 car.)', fixable: true, autoFixAction: 'ai_generate_seo' })
  } else {
    issues.push({ pillar: 'seo', severity: 'warning', message: 'Titre SEO manquant', fixable: true, autoFixAction: 'ai_generate_seo' })
  }

  // SEO description (0-30pts)
  const seoDesc = p.seo_description || ''
  if (seoDesc.length >= 100 && seoDesc.length <= 160) score += 30
  else if (seoDesc.length > 0) {
    score += 15
    issues.push({ pillar: 'seo', severity: 'info', message: 'Meta description hors plage optimale', fixable: true })
  } else {
    issues.push({ pillar: 'seo', severity: 'warning', message: 'Meta description manquante', fixable: true, autoFixAction: 'ai_generate_seo' })
  }

  // Keywords (0-20pts)
  if ((p.seo_keywords?.length || 0) >= 3) score += 20
  else if ((p.seo_keywords?.length || 0) > 0) score += 10
  else if ((p.tags?.length || 0) >= 3) score += 8 // tags as fallback

  // Title and description have keyword overlap (0-20pts)
  const title = (p.title || p.name || '').toLowerCase()
  const desc = (p.description || '').toLowerCase()
  const titleWords = title.split(/\s+/).filter(w => w.length > 3)
  const overlap = titleWords.filter(w => desc.includes(w)).length
  if (overlap >= 2) score += 20
  else if (overlap >= 1) score += 10

  return { score: Math.min(100, score), issues }
}

export class CatalogHealthEngine {
  /**
   * Analyze a single product and return a full health report
   */
  static analyzeProduct(product: ProductData): ProductHealthReport {
    const pillarResults = {
      title: scoreTitle(product),
      description: scoreDescription(product),
      images: scoreImages(product),
      pricing: scorePricing(product),
      identifiers: scoreIdentifiers(product),
      seo: scoreSEO(product),
    }

    const pillars: HealthPillar[] = Object.entries(PILLAR_WEIGHTS).map(([key, weight]) => {
      const result = pillarResults[key as keyof typeof pillarResults]
      const weightedScore = (result.score * weight) / 100
      return {
        key,
        label: {
          title: 'Titre',
          description: 'Description',
          images: 'Images',
          pricing: 'Prix & Stock',
          identifiers: 'Identifiants',
          seo: 'SEO',
        }[key] || key,
        score: result.score,
        weight,
        weightedScore,
        issues: result.issues,
        status: statusFromScore(result.score),
      }
    })

    const globalScore = Math.round(pillars.reduce((sum, p) => sum + p.weightedScore, 0))
    const allIssues = pillars.flatMap(p => p.issues)
    
    // Generate top recommendations based on worst pillars
    const recommendations: string[] = []
    const sortedPillars = [...pillars].sort((a, b) => a.score - b.score)
    
    for (const pillar of sortedPillars.slice(0, 3)) {
      if (pillar.score < 60) {
        const autoFixable = pillar.issues.filter(i => i.autoFixAction)
        if (autoFixable.length > 0) {
          recommendations.push(`Utilisez l'IA pour améliorer le pilier "${pillar.label}" (+${Math.round((80 - pillar.score) * pillar.weight / 100)} pts potentiels)`)
        } else {
          recommendations.push(`Améliorez le pilier "${pillar.label}" (score: ${pillar.score}%) pour gagner des points`)
        }
      }
    }

    return {
      productId: product.id,
      globalScore,
      grade: gradeFromScore(globalScore),
      status: statusFromScore(globalScore),
      pillars,
      issues: allIssues,
      recommendations,
      analyzedAt: new Date().toISOString(),
    }
  }

  /**
   * Analyze a batch of products and return catalog-wide summary
   */
  static analyzeCatalog(products: ProductData[]): CatalogHealthSummary {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        averageScore: 0,
        grade: 'F',
        distribution: { excellent: 0, good: 0, warning: 0, critical: 0 },
        topIssues: [],
        pillarAverages: [],
        readinessPercent: 0,
      }
    }

    const reports = products.map(p => this.analyzeProduct(p))
    const avgScore = Math.round(reports.reduce((s, r) => s + r.globalScore, 0) / reports.length)

    const distribution = {
      excellent: reports.filter(r => r.status === 'excellent').length,
      good: reports.filter(r => r.status === 'good').length,
      warning: reports.filter(r => r.status === 'warning').length,
      critical: reports.filter(r => r.status === 'critical').length,
    }

    // Aggregate issues
    const issueMap = new Map<string, { count: number; severity: string }>()
    for (const r of reports) {
      for (const issue of r.issues) {
        const existing = issueMap.get(issue.message)
        if (existing) existing.count++
        else issueMap.set(issue.message, { count: 1, severity: issue.severity })
      }
    }
    const topIssues = Array.from(issueMap.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Pillar averages
    const pillarKeys = Object.keys(PILLAR_WEIGHTS)
    const pillarAverages = pillarKeys.map(key => {
      const avg = Math.round(reports.reduce((s, r) => {
        const pillar = r.pillars.find(p => p.key === key)
        return s + (pillar?.score || 0)
      }, 0) / reports.length)
      return {
        key,
        label: reports[0]?.pillars.find(p => p.key === key)?.label || key,
        avg,
      }
    })

    // Marketplace readiness (products with score >= 70)
    const readyProducts = reports.filter(r => r.globalScore >= 70).length
    const readinessPercent = Math.round((readyProducts / reports.length) * 100)

    return {
      totalProducts: products.length,
      averageScore: avgScore,
      grade: gradeFromScore(avgScore),
      distribution,
      topIssues,
      pillarAverages,
      readinessPercent,
    }
  }
}
