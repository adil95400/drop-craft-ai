import { Play, BookOpen, ShoppingBag, Store, Bot, BarChart3, Zap, Link } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface TutorialVideo {
  id: string
  title: string
  description: string
  youtubeId: string
  duration: string
  thumbnailUrl: string
}

export interface Tutorial {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: string
  estimatedTime: string
  videos: TutorialVideo[]
  steps: TutorialStep[]
}

export interface TutorialStep {
  id: string
  title: string
  description: string
  videoId?: string
  actionLabel?: string
  actionRoute?: string
  tips?: string[]
}

export const TUTORIAL_VIDEOS: Record<string, TutorialVideo[]> = {
  'getting-started': [
    {
      id: 'gs-overview',
      title: 'Vue d\'ensemble de la plateforme',
      description: 'Découvrez l\'interface principale et les fonctionnalités clés',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '5:30',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'gs-navigation',
      title: 'Navigation et menu principal',
      description: 'Apprenez à naviguer efficacement dans l\'application',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '3:15',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    }
  ],
  'products': [
    {
      id: 'prod-import',
      title: 'Importer des produits',
      description: 'Comment importer des produits depuis vos fournisseurs',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '8:45',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'prod-optimize',
      title: 'Optimiser vos fiches produits',
      description: 'Utilisez l\'IA pour améliorer vos descriptions',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '6:20',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'prod-manage',
      title: 'Gérer votre catalogue',
      description: 'Organisation et gestion avancée des produits',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '5:10',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    }
  ],
  'connect-store': [
    {
      id: 'store-shopify',
      title: 'Connecter Shopify',
      description: 'Intégration complète avec votre boutique Shopify',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '10:00',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'store-woo',
      title: 'Connecter WooCommerce',
      description: 'Configuration de l\'intégration WooCommerce',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '8:30',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'store-presta',
      title: 'Connecter PrestaShop',
      description: 'Synchronisation avec PrestaShop',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '7:45',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    }
  ],
  'ai-features': [
    {
      id: 'ai-assistant',
      title: 'Assistant IA',
      description: 'Utilisez l\'assistant IA pour optimiser votre travail',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '7:00',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'ai-seo',
      title: 'Génération SEO avec l\'IA',
      description: 'Créez des descriptions optimisées pour le référencement',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '5:30',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'ai-images',
      title: 'Optimisation d\'images',
      description: 'Améliorez vos images produits automatiquement',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '4:15',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    }
  ],
  'analytics': [
    {
      id: 'ana-dashboard',
      title: 'Comprendre le dashboard',
      description: 'Analysez vos métriques clés en un coup d\'œil',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '6:00',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'ana-reports',
      title: 'Créer des rapports',
      description: 'Générez des rapports personnalisés',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '5:20',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    }
  ],
  'automation': [
    {
      id: 'auto-rules',
      title: 'Règles de prix automatiques',
      description: 'Configurez des règles de pricing dynamique',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '8:00',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'auto-workflows',
      title: 'Créer des workflows',
      description: 'Automatisez vos processus métier',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '6:30',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'auto-alerts',
      title: 'Configurer les alertes',
      description: 'Recevez des notifications automatiques',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '4:00',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    }
  ],
  'advanced': [
    {
      id: 'adv-api',
      title: 'Utiliser l\'API',
      description: 'Intégrez notre API dans vos outils',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '10:00',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
      id: 'adv-extensions',
      title: 'Extensions et plugins',
      description: 'Étendez les fonctionnalités de la plateforme',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '5:00',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    }
  ]
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Premiers pas',
    description: 'Découvrez les bases de la plateforme',
    icon: Play,
    color: 'bg-green-500',
    estimatedTime: '10 min',
    videos: TUTORIAL_VIDEOS['getting-started'],
    steps: [
      {
        id: 'gs-1',
        title: 'Bienvenue sur la plateforme',
        description: 'Découvrez l\'interface principale et familiarisez-vous avec le dashboard.',
        videoId: 'gs-overview',
        actionLabel: 'Voir le dashboard',
        actionRoute: '/dashboard',
        tips: ['Utilisez les raccourcis clavier pour naviguer plus vite', 'Personnalisez votre dashboard selon vos besoins']
      },
      {
        id: 'gs-2',
        title: 'Navigation et menu',
        description: 'Apprenez à naviguer dans les différentes sections de l\'application.',
        videoId: 'gs-navigation',
        tips: ['Le menu latéral peut être réduit pour plus d\'espace']
      },
      {
        id: 'gs-3',
        title: 'Votre profil',
        description: 'Configurez votre profil et vos préférences.',
        actionLabel: 'Modifier le profil',
        actionRoute: '/settings/account',
        tips: ['Ajoutez une photo de profil pour personnaliser votre compte']
      }
    ]
  },
  {
    id: 'products',
    title: 'Gestion des produits',
    description: 'Importez et gérez vos produits efficacement',
    icon: ShoppingBag,
    color: 'bg-blue-500',
    estimatedTime: '20 min',
    videos: TUTORIAL_VIDEOS['products'],
    steps: [
      {
        id: 'prod-1',
        title: 'Importer vos premiers produits',
        description: 'Apprenez à importer des produits depuis différentes sources.',
        videoId: 'prod-import',
        actionLabel: 'Importer des produits',
        actionRoute: '/products/import',
        tips: ['Vous pouvez importer par URL, fichier CSV ou depuis un fournisseur']
      },
      {
        id: 'prod-2',
        title: 'Optimiser avec l\'IA',
        description: 'Utilisez l\'intelligence artificielle pour améliorer vos fiches produits.',
        videoId: 'prod-optimize',
        actionLabel: 'Optimiser un produit',
        actionRoute: '/products',
        tips: ['L\'IA peut générer des descriptions, titres et mots-clés SEO']
      },
      {
        id: 'prod-3',
        title: 'Gérer votre catalogue',
        description: 'Organisez vos produits par catégories et collections.',
        videoId: 'prod-manage',
        tips: ['Utilisez les filtres pour retrouver rapidement vos produits']
      }
    ]
  },
  {
    id: 'connect-store',
    title: 'Connecter une boutique',
    description: 'Synchronisez avec Shopify, WooCommerce, PrestaShop',
    icon: Store,
    color: 'bg-purple-500',
    estimatedTime: '15 min',
    videos: TUTORIAL_VIDEOS['connect-store'],
    steps: [
      {
        id: 'store-1',
        title: 'Choisir votre plateforme',
        description: 'Sélectionnez la plateforme e-commerce que vous utilisez.',
        actionLabel: 'Voir les intégrations',
        actionRoute: '/settings/integrations',
        tips: ['Nous supportons Shopify, WooCommerce, PrestaShop et plus']
      },
      {
        id: 'store-2',
        title: 'Connecter Shopify',
        description: 'Suivez les étapes pour connecter votre boutique Shopify.',
        videoId: 'store-shopify',
        tips: ['Vous aurez besoin de votre URL Shopify et d\'un token API']
      },
      {
        id: 'store-3',
        title: 'Synchroniser les produits',
        description: 'Importez automatiquement vos produits depuis votre boutique.',
        tips: ['La synchronisation peut être automatique ou manuelle']
      }
    ]
  },
  {
    id: 'ai-features',
    title: 'Fonctionnalités IA',
    description: 'Exploitez la puissance de l\'intelligence artificielle',
    icon: Bot,
    color: 'bg-orange-500',
    estimatedTime: '15 min',
    videos: TUTORIAL_VIDEOS['ai-features'],
    steps: [
      {
        id: 'ai-1',
        title: 'L\'assistant IA',
        description: 'Découvrez comment l\'assistant peut vous aider au quotidien.',
        videoId: 'ai-assistant',
        tips: ['L\'assistant peut répondre à vos questions et effectuer des tâches']
      },
      {
        id: 'ai-2',
        title: 'Génération de contenu SEO',
        description: 'Créez des descriptions optimisées pour le référencement.',
        videoId: 'ai-seo',
        actionLabel: 'Essayer l\'IA',
        actionRoute: '/ai-tools',
        tips: ['Spécifiez votre ton et vos mots-clés cibles']
      },
      {
        id: 'ai-3',
        title: 'Optimisation d\'images',
        description: 'Améliorez automatiquement la qualité de vos images produits.',
        videoId: 'ai-images',
        tips: ['L\'IA peut supprimer les arrière-plans et améliorer la luminosité']
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics et rapports',
    description: 'Analysez vos performances et prenez de meilleures décisions',
    icon: BarChart3,
    color: 'bg-cyan-500',
    estimatedTime: '12 min',
    videos: TUTORIAL_VIDEOS['analytics'],
    steps: [
      {
        id: 'ana-1',
        title: 'Le tableau de bord analytics',
        description: 'Comprenez les métriques clés de votre activité.',
        videoId: 'ana-dashboard',
        actionLabel: 'Voir les analytics',
        actionRoute: '/analytics',
        tips: ['Personnalisez les widgets selon vos KPIs prioritaires']
      },
      {
        id: 'ana-2',
        title: 'Créer des rapports',
        description: 'Générez des rapports détaillés et exportez-les.',
        videoId: 'ana-reports',
        tips: ['Programmez des rapports automatiques par email']
      }
    ]
  },
  {
    id: 'automation',
    title: 'Automatisation',
    description: 'Automatisez vos tâches répétitives',
    icon: Zap,
    color: 'bg-yellow-500',
    estimatedTime: '18 min',
    videos: TUTORIAL_VIDEOS['automation'],
    steps: [
      {
        id: 'auto-1',
        title: 'Règles de prix',
        description: 'Configurez des règles de pricing dynamique.',
        videoId: 'auto-rules',
        actionLabel: 'Créer une règle',
        actionRoute: '/automation/pricing',
        tips: ['Définissez des marges minimales pour protéger vos profits']
      },
      {
        id: 'auto-2',
        title: 'Workflows automatisés',
        description: 'Créez des workflows pour automatiser vos processus.',
        videoId: 'auto-workflows',
        tips: ['Combinez plusieurs actions pour créer des automatisations complexes']
      },
      {
        id: 'auto-3',
        title: 'Alertes et notifications',
        description: 'Configurez des alertes pour être notifié des événements importants.',
        videoId: 'auto-alerts',
        tips: ['Recevez des alertes par email, SMS ou notification push']
      }
    ]
  },
  {
    id: 'advanced',
    title: 'Fonctionnalités avancées',
    description: 'API, extensions et intégrations personnalisées',
    icon: Link,
    color: 'bg-red-500',
    estimatedTime: '15 min',
    videos: TUTORIAL_VIDEOS['advanced'],
    steps: [
      {
        id: 'adv-1',
        title: 'L\'API REST',
        description: 'Intégrez notre API dans vos outils et applications.',
        videoId: 'adv-api',
        actionLabel: 'Documentation API',
        actionRoute: '/settings/api',
        tips: ['Générez des clés API depuis les paramètres']
      },
      {
        id: 'adv-2',
        title: 'Extensions',
        description: 'Découvrez et installez des extensions pour étendre les fonctionnalités.',
        videoId: 'adv-extensions',
        tips: ['Certaines extensions sont disponibles uniquement en plan Pro']
      }
    ]
  }
]

export function getTutorialById(id: string): Tutorial | undefined {
  return TUTORIALS.find(t => t.id === id)
}

export function getVideoById(videoId: string): TutorialVideo | undefined {
  for (const videos of Object.values(TUTORIAL_VIDEOS)) {
    const video = videos.find(v => v.id === videoId)
    if (video) return video
  }
  return undefined
}

export function getAllVideos(): TutorialVideo[] {
  return Object.values(TUTORIAL_VIDEOS).flat()
}
