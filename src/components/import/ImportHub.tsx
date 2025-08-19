import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { usePlan } from '@/hooks/usePlan'
import { EnhancedImportInterface } from './EnhancedImportInterface'
import { AIWinnersDiscovery } from './AIWinnersDiscovery'
import { 
  Package, 
  Zap, 
  Globe, 
  FileSpreadsheet, 
  Image, 
  Bot,
  TrendingUp,
  Activity,
  CheckCircle
} from 'lucide-react'

export const ImportHub = () => {
  const [selectedMethod, setSelectedMethod] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("methods")
  const { toast } = useToast()
  const { isPro, isUltraPro } = usePlan()

  const handleImport = async (data: any) => {
    setIsImporting(true)
    setImportProgress(0)

    const stages = [15, 35, 55, 75, 90, 100]
    for (const progress of stages) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setImportProgress(progress)
    }

    setIsImporting(false)
    setImportProgress(0)
    
    toast({
      title: "Import réussi !",
      description: "Produit importé avec succès",
    })
  }

  const handleImportWinner = (productId: string) => {
    toast({
      title: "Winner importé !",
      description: "Le produit gagnant a été ajouté à votre catalogue",
    })
  }

  const quickStats = [
    { icon: Package, label: "Produits importés", value: "1,247", color: "text-blue-600" },
    { icon: TrendingUp, label: "Taux de réussite", value: "94.5%", color: "text-green-600" },
    { icon: Zap, label: "Temps moyen", value: "2.3s", color: "text-purple-600" },
    { icon: Activity, label: "Heures économisées", value: "156h", color: "text-orange-600" }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover-scale animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interface principale avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="methods" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Méthodes d'Import
          </TabsTrigger>
          <TabsTrigger value="winners" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Winners IA
            {!isPro() && <Badge variant="outline" className="ml-1 text-xs">Pro</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="mt-6">
          <EnhancedImportInterface
            selectedMethod={selectedMethod}
            isImporting={isImporting}
            importProgress={importProgress}
            onImport={handleImport}
          />
        </TabsContent>

        <TabsContent value="winners" className="mt-6">
          {isPro() ? (
            <AIWinnersDiscovery onImportWinner={handleImportWinner} />
          ) : (
            <Card className="text-center p-8">
              <CardContent>
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Winners IA - Fonctionnalité Premium</h3>
                <p className="text-muted-foreground mb-4">
                  Découvrez automatiquement les produits gagnants avec notre IA avancée
                </p>
                <Button>Passer au plan Pro</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Historique d'Import
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: "URL", source: "Amazon", status: "Succès", date: "Il y a 2h", products: 1 },
                  { type: "CSV", source: "AliExpress", status: "Succès", date: "Il y a 4h", products: 25 },
                  { type: "Winners IA", source: "IA Discovery", status: "Succès", date: "Il y a 1j", products: 8 }
                ].map((import_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg animate-fade-in">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{import_.type} - {import_.source}</p>
                        <p className="text-xs text-muted-foreground">{import_.products} produit(s) importé(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-green-600">{import_.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{import_.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}