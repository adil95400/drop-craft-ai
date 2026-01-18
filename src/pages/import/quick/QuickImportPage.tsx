import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Zap, FileSpreadsheet, Upload, BarChart3, CheckCircle } from 'lucide-react'
import { UnifiedImportInterface } from '@/components/import/UnifiedImportInterface'
import { CSVImportWizard } from '@/components/import/CSVImportWizard'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function QuickImportPage() {
  const prefersReducedMotion = useReducedMotion()

  const stats = [
    { label: 'Formats supportés', value: '5+' },
    { label: 'Mapping auto', value: '95%' },
    { label: 'Colonnes max', value: '100+' },
    { label: 'Taille max', value: '50MB' }
  ]

  const features = [
    { icon: FileSpreadsheet, title: 'CSV & Excel', description: 'Importez vos fichiers CSV, XLS, XLSX' },
    { icon: Upload, title: 'Glisser-déposer', description: 'Interface intuitive par drag & drop' },
    { icon: BarChart3, title: 'Mapping intelligent', description: 'Détection automatique des colonnes' },
    { icon: CheckCircle, title: 'Validation', description: 'Vérification des données en temps réel' }
  ]

  return (
    <ChannablePageLayout
      title="Import CSV / Excel"
      metaTitle="Import CSV / Excel"
      metaDescription="Importez vos catalogues produits depuis des fichiers CSV ou Excel avec mapping intelligent"
      maxWidth="2xl"
      padding="md"
      backTo="/import"
      backLabel="Retour à l'import"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        badge="Import Fichier"
        title="Import CSV / Excel"
        subtitle="avec mapping intelligent"
        description="Importez vos catalogues produits depuis des fichiers CSV ou Excel. Notre IA détecte automatiquement les colonnes et valide vos données."
        stats={stats}
        showHexagons={!prefersReducedMotion}
        variant="compact"
      />

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-none bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Import Tabs */}
      <Card className="border-2">
        <CardContent className="p-6">
          <Tabs defaultValue="wizard" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
              <TabsTrigger value="wizard" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                Import CSV Guidé
              </TabsTrigger>
              <TabsTrigger value="quick" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Zap className="h-4 w-4" />
                Import Rapide
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wizard" className="mt-0">
              <CSVImportWizard />
            </TabsContent>

            <TabsContent value="quick" className="mt-0">
              <UnifiedImportInterface />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ChannablePageLayout>
  )
}
