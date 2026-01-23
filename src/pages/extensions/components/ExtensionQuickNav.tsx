/**
 * Quick navigation cards for extensions
 */
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LucideIcon, Chrome, Play, FileText, MessageSquare, Store, Terminal, Settings, Palette, Shield, Key, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExtensionItem {
  id: string
  title: string
  description: string
  icon: LucideIcon
  route: string
  badge: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
  featured?: boolean
}

const extensionItems: ExtensionItem[] = [
  {
    id: 'chrome',
    title: 'Extension Chrome',
    description: 'Téléchargez et configurez l\'extension',
    icon: Chrome,
    route: '/extensions/chrome',
    badge: 'Gratuit',
    badgeVariant: 'default',
    featured: true
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Découvrez des extensions additionnelles',
    icon: Store,
    route: '/extensions/marketplace',
    badge: 'Nouveau',
    badgeVariant: 'default'
  },
  {
    id: 'tutorials',
    title: 'Tutoriels',
    description: 'Guides vidéo et documentation',
    icon: Play,
    route: '/extensions/tutorials',
    badge: 'Guide'
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Référence technique complète',
    icon: FileText,
    route: '/extensions/documentation',
    badge: 'Docs'
  },
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Questions fréquentes',
    icon: MessageSquare,
    route: '/extensions/faq',
    badge: 'Support'
  },
  {
    id: 'api',
    title: 'API & Tokens',
    description: 'Gérez vos clés d\'accès',
    icon: Key,
    route: '/extensions/api',
    badge: 'API'
  },
  {
    id: 'cli',
    title: 'CLI Tools',
    description: 'Automatisation en ligne de commande',
    icon: Terminal,
    route: '/extensions/cli',
    badge: 'Pro'
  },
  {
    id: 'developer',
    title: 'Développeur',
    description: 'SDK et ressources dev',
    icon: Settings,
    route: '/extensions/developer',
    badge: 'Dev'
  },
  {
    id: 'white-label',
    title: 'White-Label',
    description: 'Personnalisez à vos couleurs',
    icon: Palette,
    route: '/extensions/white-label',
    badge: 'Enterprise'
  },
  {
    id: 'sso',
    title: 'Enterprise SSO',
    description: 'Single Sign-On pour équipes',
    icon: Shield,
    route: '/extensions/sso',
    badge: 'Enterprise'
  }
]

interface ExtensionQuickNavProps {
  className?: string
}

export function ExtensionQuickNav({ className }: ExtensionQuickNavProps) {
  const navigate = useNavigate()
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Featured Extension */}
      {extensionItems.filter(ext => ext.featured).map((ext) => (
        <motion.div
          key={ext.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card 
            className="cursor-pointer border-primary/30 bg-gradient-to-br from-primary/5 via-card to-purple-500/5 hover:shadow-xl hover:border-primary/50 transition-all group overflow-hidden"
            onClick={() => navigate(ext.route)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(ext.route)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                  <ext.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {ext.title}
                    </h3>
                    <Badge className="bg-green-500 text-white">
                      {ext.badge}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{ext.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Other Extensions Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {extensionItems.filter(ext => !ext.featured).map((ext, idx) => (
          <motion.div
            key={ext.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card 
              className="cursor-pointer h-full border-border/50 bg-card/50 backdrop-blur hover:shadow-lg hover:border-primary/30 transition-all group"
              onClick={() => navigate(ext.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(ext.route)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <ext.icon className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {ext.badge}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {ext.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{ext.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
