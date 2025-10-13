/**
 * Service pour le marketplace d'extensions
 * Gère la recherche, les filtres et les métadonnées
 */

export interface ExtensionBase {
  id: string
  name: string
  description: string
  category: string
  downloads: string
  rating: number
  price: string
  verified: boolean
  developer: string
  version: string
  lastUpdated: string
  featured?: boolean
  minPlan?: 'free' | 'pro' | 'ultra_pro'
  icon?: string
  screenshots?: string[]
  permissions?: string[]
  changelog?: string
  supportUrl?: string
  documentationUrl?: string
  created_at: string
  updated_at: string
}

export interface MarketplaceFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  verified?: boolean
  featured?: boolean
  minPlan?: 'free' | 'pro' | 'ultra_pro'
}

export interface MarketplaceExtension extends ExtensionBase {
  installCount?: number
  recentUpdates?: string[]
  compatibilityScore?: number
}

class MarketplaceService {
  /**
   * Récupérer toutes les extensions du marketplace
   */
  async getExtensions(filters?: MarketplaceFilters): Promise<MarketplaceExtension[]> {
    // Pour l'instant, retourner des données mockées
    // TODO: Remplacer par un appel API réel
    return this.getMockExtensions(filters)
  }

  /**
   * Récupérer une extension spécifique par ID
   */
  async getExtensionById(id: string): Promise<MarketplaceExtension | null> {
    const extensions = await this.getExtensions()
    return extensions.find(ext => ext.id === id) || null
  }

  /**
   * Rechercher des extensions
   */
  async searchExtensions(query: string): Promise<MarketplaceExtension[]> {
    return this.getExtensions({ search: query })
  }

  /**
   * Récupérer les extensions par catégorie
   */
  async getExtensionsByCategory(category: string): Promise<MarketplaceExtension[]> {
    return this.getExtensions({ category })
  }

  /**
   * Récupérer les extensions populaires
   */
  async getFeaturedExtensions(): Promise<MarketplaceExtension[]> {
    return this.getExtensions({ featured: true })
  }

  /**
   * Récupérer les catégories disponibles
   */
  async getCategories(): Promise<Array<{ id: string; name: string; count: number }>> {
    return [
      { id: 'all', name: 'Toutes', count: 247 },
      { id: 'integrations', name: 'Intégrations', count: 89 },
      { id: 'analytics', name: 'Analytics', count: 56 },
      { id: 'automation', name: 'Automatisation', count: 43 },
      { id: 'marketing', name: 'Marketing', count: 31 },
      { id: 'security', name: 'Sécurité', count: 28 }
    ]
  }

  /**
   * Données mockées (à remplacer par API)
   */
  private getMockExtensions(filters?: MarketplaceFilters): MarketplaceExtension[] {
    const allExtensions: MarketplaceExtension[] = [
      {
        id: '1',
        name: "Shopify Sync Pro",
        description: "Synchronisation bidirectionnelle complète avec Shopify",
        category: "Intégrations",
        downloads: "3.2K",
        rating: 4.9,
        price: "Gratuit",
        verified: true,
        developer: "Drop Craft Team",
        version: "2.1.4",
        lastUpdated: "2024-01-15",
        featured: true,
        minPlan: "free",
        installCount: 3200,
        created_at: "2024-01-01",
        updated_at: "2024-01-15"
      },
      {
        id: '2',
        name: "AI Product Optimizer",
        description: "IA avancée pour optimiser vos descriptions produits",
        category: "Automatisation",
        downloads: "2.1K",
        rating: 4.9,
        price: "29€/mois",
        verified: true,
        developer: "AI Labs",
        version: "1.3.2",
        lastUpdated: "2024-01-10",
        featured: true,
        minPlan: "pro",
        installCount: 2100,
        created_at: "2024-01-02",
        updated_at: "2024-01-10"
      },
      {
        id: '3',
        name: "Advanced Analytics Pro",
        description: "Tableaux de bord avancés avec prédictions IA",
        category: "Analytics",
        downloads: "1.8K",
        rating: 4.8,
        price: "39€/mois",
        verified: true,
        developer: "Analytics Plus",
        version: "1.4.7",
        lastUpdated: "2024-01-14",
        featured: true,
        minPlan: "pro",
        installCount: 1800,
        created_at: "2024-01-03",
        updated_at: "2024-01-14"
      },
      {
        id: '4',
        name: "Security & GDPR Suite",
        description: "Outils complets de sécurité et conformité GDPR",
        category: "Sécurité",
        downloads: "892",
        rating: 4.6,
        price: "39€/mois",
        verified: true,
        developer: "SecureCommerce",
        version: "1.8.0",
        lastUpdated: "2024-01-05",
        minPlan: "ultra_pro",
        installCount: 892,
        created_at: "2024-01-04",
        updated_at: "2024-01-05"
      },
      {
        id: '5',
        name: "Marketing Automation Suite",
        description: "Automatisation marketing complète",
        category: "Marketing",
        downloads: "1.5K",
        rating: 4.7,
        price: "19€/mois",
        verified: false,
        developer: "Marketing Pro",
        version: "3.0.1",
        lastUpdated: "2024-01-08",
        minPlan: "pro",
        installCount: 1500,
        created_at: "2024-01-05",
        updated_at: "2024-01-08"
      },
      {
        id: '6',
        name: "WooCommerce Bridge",
        description: "Connecteur avancé pour WooCommerce",
        category: "Intégrations",
        downloads: "1.65K",
        rating: 4.5,
        price: "15€/mois",
        verified: false,
        developer: "WooTools",
        version: "2.5.3",
        lastUpdated: "2024-01-12",
        minPlan: "free",
        installCount: 1650,
        created_at: "2024-01-06",
        updated_at: "2024-01-12"
      }
    ]

    let filtered = allExtensions

    if (filters) {
      if (filters.search) {
        const query = filters.search.toLowerCase()
        filtered = filtered.filter(ext => 
          ext.name.toLowerCase().includes(query) ||
          ext.description.toLowerCase().includes(query)
        )
      }

      if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(ext => ext.category === filters.category)
      }

      if (filters.verified !== undefined) {
        filtered = filtered.filter(ext => ext.verified === filters.verified)
      }

      if (filters.featured !== undefined) {
        filtered = filtered.filter(ext => ext.featured === filters.featured)
      }

      if (filters.minPlan) {
        filtered = filtered.filter(ext => ext.minPlan === filters.minPlan)
      }
    }

    return filtered
  }
}

export const marketplaceService = new MarketplaceService()
