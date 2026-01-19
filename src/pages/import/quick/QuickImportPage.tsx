import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Zap, FileSpreadsheet, Upload, BarChart3, CheckCircle, RefreshCw } from 'lucide-react'
import { UnifiedImportInterface } from '@/components/import/UnifiedImportInterface'
import { CSVImportWizard } from '@/components/import/CSVImportWizard'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function QuickImportPage() {
  const prefersReducedMotion = useReducedMotion()
  const navigate = useNavigate()

  const features = [
    { icon: FileSpreadsheet, title: 'CSV & Excel', description: 'Importez vos fichiers CSV, XLS, XLSX' },
    { icon: Upload, title: 'Glisser-déposer', description: 'Interface intuitive par drag & drop' },
    { icon: BarChart3, title: 'Mapping intelligent', description: 'Détection automatique des colonnes' },
    { icon: CheckCircle, title: 'Validation', description: 'Vérification des données en temps réel' }
  ]

  return (
    <ChannablePageWrapper
      title="Import CSV / Excel"
      subtitle="Mapping intelligent"
      description="Importez vos catalogues produits depuis des fichiers CSV ou Excel. Notre IA détecte automatiquement les colonnes et valide vos données."
      heroImage="suppliers"
      badge={{ label: "Import Fichier", icon: FileSpreadsheet }}
      actions={
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/import/history')} variant="outline" className="gap-2 bg-background/80 backdrop-blur">
            <RefreshCw className="h-4 w-4" />
            Historique
          </Button>
        </div>
      }
    >
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
    </ChannablePageWrapper>
  )
}
