import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Globe, FileCode2, Server, Database, History, Activity, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdvancedImport } from '@/domains/commerce/hooks/useAdvancedImport'
import { StatsCard } from '@/components/import/advanced/StatsCard'
import { URLImportCard } from '@/components/import/advanced/URLImportCard'
import { XMLRSSImportCard } from '@/components/import/advanced/XMLRSSImportCard'
import { FTPImportCard } from '@/components/import/advanced/FTPImportCard'
import { ImportJobsMonitor } from '@/components/import/advanced/ImportJobsMonitor'
import { ImportHistoryTimeline } from '@/components/import/advanced/ImportHistoryTimeline'
import { FTPConnectorManager } from '@/components/import/advanced/FTPConnectorManager'

export default function AdvancedImport() {
  const navigate = useNavigate()
  
  const {
    activeJobs,
    completedJobs,
    products,
    connectors,
    importFromUrl,
    importFromXml,
    importFromFtp,
    deleteConnector,
    testConnection,
    isImportingUrl,
    isImportingXml,
    isImportingFtp,
    isTestingConnection,
    stats
  } = useAdvancedImport()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Import Avancé Pro</h1>
          <p className="text-muted-foreground">
            Monitoring temps réel, import URL/XML/FTP et gestion des connecteurs
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/import')}>
          Retour au Hub
        </Button>
      </div>

      {/* Stats en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Imports Actifs" 
          value={stats.activeImports}
          icon={Activity}
          description={stats.activeImports > 0 ? "En cours..." : "Aucun actif"}
        />
        <StatsCard 
          title="Taux de Succès" 
          value={`${stats.successRate}%`}
          icon={TrendingUp}
          trend={stats.successRate > 80 ? 'up' : stats.successRate > 50 ? 'neutral' : 'down'}
        />
        <StatsCard 
          title="Produits Importés" 
          value={stats.productsImported}
          icon={Database}
        />
        <StatsCard 
          title="Total Imports" 
          value={stats.totalImports}
          icon={History}
        />
      </div>

      {/* Monitoring en temps réel */}
      {activeJobs.length > 0 && (
        <ImportJobsMonitor jobs={activeJobs} />
      )}

      {/* Onglets principaux */}
      <Tabs defaultValue="url" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Import URL
          </TabsTrigger>
          <TabsTrigger value="xml" className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4" />
            XML/RSS
          </TabsTrigger>
          <TabsTrigger value="ftp" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            FTP
          </TabsTrigger>
          <TabsTrigger value="connectors" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Connecteurs ({connectors.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url">
          <URLImportCard 
            onImport={importFromUrl} 
            isLoading={isImportingUrl}
          />
        </TabsContent>

        <TabsContent value="xml">
          <XMLRSSImportCard 
            onImport={importFromXml} 
            isLoading={isImportingXml}
          />
        </TabsContent>

        <TabsContent value="ftp">
          <FTPImportCard 
            onImport={importFromFtp} 
            isLoading={isImportingFtp}
          />
        </TabsContent>

        <TabsContent value="connectors">
          <FTPConnectorManager 
            connectors={connectors}
            onDelete={deleteConnector}
            onTest={testConnection}
            isTestingId={isTestingConnection ? 'testing' : undefined}
          />
        </TabsContent>

        <TabsContent value="history">
          <ImportHistoryTimeline 
            jobs={completedJobs} 
            products={products}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
