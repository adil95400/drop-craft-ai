/**
 * Extensions Hub - Professional landing page for ShopOpti+ Chrome Extension
 * Reorganized with modular components for better maintainability
 */
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Chrome, Play, Sparkles, LayoutDashboard } from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { 
  ExtensionQuickNav,
  ExtensionFeatures,
  ExtensionPlatforms,
  ExtensionTestimonials,
  ExtensionCTA
} from './components'
import { ExtensionConnectionHub } from '@/components/extensions/ExtensionConnectionHub'

export default function ExtensionsHub() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'overview'>('dashboard')

  return (
    <ChannablePageWrapper
      title="ShopOpti+ Chrome Extension"
      subtitle="#1 Extension Dropshipping"
      description="L'extension Chrome la plus puissante pour le dropshipping. Importez, surveillez, automatisez - tout depuis votre navigateur."
      heroImage="extensions"
      badge={{ label: '#1 Extension Dropshipping', icon: Chrome }}
      actions={
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => navigate('/extensions/chrome')}
            className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 gap-2"
          >
            <Chrome className="w-4 h-4" />
            Extension Chrome
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/extensions/tutorials')}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Voir les Tutoriels
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Fonctionnalités
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ExtensionConnectionHub />
        </TabsContent>

        <TabsContent value="overview" className="space-y-8">
          {/* Quick Features Overview */}
          <section>
            <ExtensionFeatures variant="compact" />
          </section>

          {/* Supported Platforms */}
          <section>
            <ExtensionPlatforms />
          </section>

          {/* Detailed Features */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Fonctionnalités avancées
            </h2>
            <ExtensionFeatures variant="detailed" />
          </section>

          {/* Testimonials */}
          <section>
            <ExtensionTestimonials />
          </section>

          {/* Quick Navigation to other extensions */}
          <section>
            <h2 className="text-xl font-bold mb-4">Outils & Extensions</h2>
            <ExtensionQuickNav />
          </section>

          {/* Final CTA */}
          <section>
            <ExtensionCTA />
          </section>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
