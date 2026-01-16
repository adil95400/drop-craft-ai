import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Megaphone, 
  Mail, 
  Tag, 
  ShoppingCart, 
  Award, 
  Zap, 
  Share2, 
  Users, 
  Calendar,
  BarChart3,
  Sparkles,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickNavItem {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  color: string
  badge?: string
}

const navItems: QuickNavItem[] = [
  {
    id: 'ads',
    name: 'Campagnes Ads',
    description: 'Gérer vos publicités multi-plateformes',
    icon: Megaphone,
    route: '/marketing/ads',
    color: 'text-orange-500 bg-orange-500/10',
  },
  {
    id: 'email',
    name: 'Email Marketing',
    description: 'Créer et envoyer des campagnes email',
    icon: Mail,
    route: '/marketing/email',
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    id: 'promotions',
    name: 'Promotions',
    description: 'Codes promo et remises automatiques',
    icon: Tag,
    route: '/marketing/promotions',
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    id: 'abandoned',
    name: 'Paniers Abandonnés',
    description: 'Récupérer les ventes perdues',
    icon: ShoppingCart,
    route: '/marketing/abandoned-cart',
    color: 'text-red-500 bg-red-500/10',
  },
  {
    id: 'loyalty',
    name: 'Fidélité',
    description: 'Programme de fidélité client',
    icon: Award,
    route: '/marketing/loyalty',
    color: 'text-amber-500 bg-amber-500/10',
  },
  {
    id: 'flash-sales',
    name: 'Ventes Flash',
    description: 'Offres limitées dans le temps',
    icon: Zap,
    route: '/marketing/flash-sales',
    color: 'text-purple-500 bg-purple-500/10',
    badge: 'Hot',
  },
  {
    id: 'social',
    name: 'Social Commerce',
    description: 'TikTok, Instagram, Facebook',
    icon: Share2,
    route: '/marketing/social-commerce',
    color: 'text-pink-500 bg-pink-500/10',
  },
  {
    id: 'affiliate',
    name: 'Affiliation',
    description: 'Programme partenaires et affiliés',
    icon: Users,
    route: '/marketing/affiliate',
    color: 'text-cyan-500 bg-cyan-500/10',
  },
  {
    id: 'calendar',
    name: 'Calendrier',
    description: 'Planifier vos campagnes',
    icon: Calendar,
    route: '/marketing/calendar',
    color: 'text-indigo-500 bg-indigo-500/10',
  },
  {
    id: 'ab-testing',
    name: 'A/B Testing',
    description: 'Tester et optimiser vos campagnes',
    icon: BarChart3,
    route: '/marketing/ab-testing',
    color: 'text-violet-500 bg-violet-500/10',
  },
  {
    id: 'content',
    name: 'Contenu IA',
    description: 'Génération de contenu automatique',
    icon: Sparkles,
    route: '/marketing/content-generation',
    color: 'text-rose-500 bg-rose-500/10',
    badge: 'IA',
  },
  {
    id: 'seo',
    name: 'SEO',
    description: 'Optimisation référencement',
    icon: Search,
    route: '/marketing/seo',
    color: 'text-teal-500 bg-teal-500/10',
  },
]

export function MarketingQuickNav() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Accès Rapide</h2>
        <Link to="/marketing/calendar" className="text-sm text-primary hover:underline">
          Voir le calendrier →
        </Link>
      </div>
      
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {navItems.map((item) => (
          <Link key={item.id} to={item.route}>
            <Card className="p-4 hover:shadow-md transition-all hover:border-primary/30 cursor-pointer group h-full">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg shrink-0', item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm group-hover:text-primary truncate">
                      {item.name}
                    </h3>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
