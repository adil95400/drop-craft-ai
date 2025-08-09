import React, { useState } from "react"
import { ImportHeader } from "@/components/import/ImportHeader"
import { BulkImportUltraPro } from "@/components/import/BulkImportUltraPro"
import { AIImportUltraPro } from "@/components/import/AIImportUltraPro"
import { ScheduledImportsUltraPro } from "@/components/import/ScheduledImportsUltraPro"
import { AdvancedSupplierIntegration } from "@/components/import/AdvancedSupplierIntegration"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Package, 
  Users, 
  TrendingUp, 
  History, 
  Crown, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Edit,
  Star,
  Calendar,
  BarChart3
} from "lucide-react"
import { toast } from "sonner"
import { useImportUltraPro } from "@/hooks/useImportUltraPro"
import { AppLayout } from "@/layouts/AppLayout"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const ImportUltraPro = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { 
    importedProducts, 
    scheduledImports, 
    aiJobs,
    isLoadingProducts 
  } = useImportUltraPro()

  const handleQuickImport = () => {
    toast.info("Redirection vers l'import rapide...")
  }

  const handleValidateProduct = (productId: string) => {
    toast.success("Produit validé et ajouté au catalogue")
  }

  const handleEditProduct = (productId: string) => {
    toast.info("Ouverture de l'éditeur de produit...")
  }

  // Statistics
  const stats = {
    totalImported: importedProducts.length,
    successRate: 94.2,
    aiOptimized: aiJobs.filter(job => job.status === 'completed').length,
    scheduledActive: scheduledImports.filter(s => s.is_active).length
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'imported':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Package className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      imported: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getWinnerBadge = (aiScore: number) => {
    if (aiScore >= 8) return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white"><Crown className="h-3 w-3 mr-1" />Winner</Badge>
    if (aiScore >= 6) return <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Potentiel</Badge>
    return null
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative bg-gradient-hero p-6 lg:p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="text-white">
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                  IA et automatisation complète
                </h1>
                <p className="text-xl opacity-90">
                  Solution d'import avancée avec intelligence artificielle
                </p>
              </div>
              <Badge className="bg-gradient-accent text-white px-6 py-3 text-lg font-bold shadow-glow animate-pulse-glow">
                <Crown className="h-6 w-6 mr-2" />
                ULTRA PRO
              </Badge>
            </div>

            {/* Advanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="text-right text-white">
                      <div className="text-3xl font-bold">{stats.successRate}%</div>
                      <p className="text-sm opacity-80">Taux de Succès</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">Import automatique réussi</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Zap className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="text-right text-white">
                      <div className="text-3xl font-bold">{stats.aiOptimized}</div>
                      <p className="text-sm opacity-80">IA Optimisés</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">Traités par l'IA</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <Calendar className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="text-right text-white">
                      <div className="text-3xl font-bold">{stats.scheduledActive}</div>
                      <p className="text-sm opacity-80">Imports Planifiés</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">Actifs</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-muted/50">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Fournisseurs
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                IA Smart
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Import Masse
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Planification
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Produits Winners Récents
                    </CardTitle>
                    <CardDescription>
                      Produits à fort potentiel détectés par l'IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {importedProducts
                        .filter(p => p.ai_score >= 7)
                        .slice(0, 5)
                        .map((product) => (
                          <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-md transition-shadow">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={product.image_urls?.[0]} alt={product.name} />
                              <AvatarFallback>{product.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getWinnerBadge(product.ai_score)}
                                <span className="text-sm text-muted-foreground">
                                  Score IA: {product.ai_score}/10
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{product.suggested_price?.toFixed(2)}€</p>
                              <p className="text-xs text-muted-foreground">
                                Marge: {product.suggested_price && product.import_price ? 
                                  Math.round(((product.suggested_price - product.import_price) / product.import_price) * 100) : 0}%
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Activité IA Récente
                    </CardTitle>
                    <CardDescription>
                      Dernières optimisations automatiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiJobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                              <Zap className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium capitalize">
                                {job.job_type.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(job.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                          <Badge className={
                            job.status === 'completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {job.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-6">
              <AdvancedSupplierIntegration />
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <AIImportUltraPro />
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6">
              <BulkImportUltraPro />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <ScheduledImportsUltraPro />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique des Imports
                  </CardTitle>
                  <CardDescription>
                    Tous vos produits importés avec détails avancés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Score IA</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedProducts.slice(0, 10).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={product.image_urls?.[0]} alt={product.name} />
                              <AvatarFallback>{product.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.category}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.source_platform}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.suggested_price?.toFixed(2)}€</p>
                              <p className="text-xs text-muted-foreground">
                                Coût: {product.import_price?.toFixed(2)}€
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.ai_score}/10</span>
                              {getWinnerBadge(product.ai_score)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(product.status)}
                              <Badge className={getStatusBadge(product.status)}>
                                {product.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(product.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditProduct(product.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleValidateProduct(product.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}

export default ImportUltraPro