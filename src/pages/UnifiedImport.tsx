import React from 'react';
import { FeatureGate } from '@/components/common/FeatureGate';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { CSVMappingInterface } from '@/components/import/CSVMappingInterface';
import { URLImportInterface } from '@/components/import/URLImportInterface';
import { XMLFeedImporter } from '@/components/import/XMLFeedImporter';
import { FTPImporter } from '@/components/import/FTPImporter';
import { BulkZipImport } from '@/components/import/BulkZipImport';
import { ImportHistory } from '@/components/import/ImportHistory';
import { ImportDashboard } from '@/components/import/ImportDashboard';
import { RealTimeImportProcessor } from '@/components/import/RealTimeImportProcessor';
import { SmartImportRecommendations } from '@/components/import/SmartImportRecommendations';
import { ImportPerformanceMonitor } from '@/components/import/ImportPerformanceMonitor';
import { toast } from 'sonner';

// Lazy load the actual import components
const ImportBasic = React.lazy(() => import('./Import'));
const ImportAdvanced = React.lazy(() => import('./ImportAdvanced'));

const UnifiedImport: React.FC = () => {
  const { hasFeature } = useUnifiedPlan();
  const aiImportEnabled = hasFeature('ai-import');
  const [activeTab, setActiveTab] = React.useState<'basic' | 'csv' | 'url' | 'xml' | 'ftp' | 'bulk' | 'history' | 'realtime' | 'recommendations' | 'monitor'>('basic');
  const [csvData, setCsvData] = React.useState<{headers: string[], rows: string[][]} | null>(null);
  const [showMappingInterface, setShowMappingInterface] = React.useState(false);

  const handleCSVUpload = (data: {headers: string[], rows: string[][]}) => {
    setCsvData(data);
    setShowMappingInterface(true);
  };

  const handleMappingComplete = (mappings: any) => {
    console.log('Mappings completed:', mappings);
    setShowMappingInterface(false);
    // Process the import with mappings
  };

  const handleImportComplete = (result: any) => {
    console.log('Import completed:', result);
    // Optionally switch to history tab to see the result
    setActiveTab('history');
  };

  if (showMappingInterface && csvData) {
    return (
      <CSVMappingInterface
        csvData={csvData}
        onMappingComplete={handleMappingComplete}
        onCancel={() => setShowMappingInterface(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Import Interface */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Import de Produits</h1>
          {aiImportEnabled && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                🤖 IA Activée
              </span>
            </div>
          )}
        </div>

        {/* Import Method Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'basic' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Import Basique
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'csv' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            CSV Avancé
          </button>
          <FeatureGate feature="advanced-import" fallback={null} showUpgrade={false}>
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'url' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Scraper URL
            </button>
          </FeatureGate>
          <FeatureGate feature="advanced-import" fallback={null} showUpgrade={false}>
            <button
              onClick={() => setActiveTab('xml')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'xml' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Flux XML
            </button>
          </FeatureGate>
          <FeatureGate feature="advanced-import" fallback={null} showUpgrade={false}>
            <button
              onClick={() => setActiveTab('ftp')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'ftp' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Import FTP
            </button>
          </FeatureGate>
          <FeatureGate feature="bulk-import" fallback={null} showUpgrade={false}>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'bulk' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Import ZIP
            </button>
          </FeatureGate>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Historique
          </button>
          <FeatureGate feature="ai-import" fallback={null} showUpgrade={false}>
            <button
              onClick={() => setActiveTab('realtime')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'realtime' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Temps Réel
            </button>
          </FeatureGate>
          <FeatureGate feature="ai-import" fallback={null} showUpgrade={false}>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recommendations' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Recommandations IA
            </button>
          </FeatureGate>
          <FeatureGate feature="ai-import" fallback={null} showUpgrade={false}>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'monitor' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Monitoring
            </button>
          </FeatureGate>
          <button
            onClick={() => window.location.href = '/import/products'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-muted text-muted-foreground hover:bg-muted/80`}
          >
            Produits Importés
          </button>
        </div>
        
        {/* Import Content */}
        {activeTab === 'basic' && (
          <React.Suspense fallback={<div>Chargement...</div>}>
            <ImportBasic />
          </React.Suspense>
        )}

        {activeTab === 'csv' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Import CSV avec Mapping</h2>
            <p className="text-muted-foreground mb-4">
              Importez vos produits depuis un fichier CSV avec mapping automatique des colonnes.
            </p>
            
            {/* CSV Upload Component would go here */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="text-4xl">📄</div>
                <div>
                  <h3 className="text-lg font-medium">Téléchargez votre fichier CSV</h3>
                  <p className="text-sm text-muted-foreground">
                    Formats supportés: CSV, TSV (max 10MB)
                  </p>
                </div>
                <label
                  htmlFor="csv-upload"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer"
                >
                  Télécharger un fichier CSV
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv,.tsv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: Implement real CSV parsing
                        toast.error('Importation CSV à implémenter');
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'url' && (
          <URLImportInterface
            onProductScraped={handleImportComplete}
            onCancel={() => setActiveTab('basic')}
          />
        )}

        {activeTab === 'xml' && (
          <XMLFeedImporter />
        )}

        {activeTab === 'ftp' && (
          <FTPImporter />
        )}

        {activeTab === 'bulk' && (
          <BulkZipImport />
        )}

        {activeTab === 'history' && (
          <>
            <ImportHistory />
            <ImportDashboard />
          </>
        )}

        {activeTab === 'realtime' && (
          <RealTimeImportProcessor />
        )}

        {activeTab === 'recommendations' && (
          <SmartImportRecommendations />
        )}

        {activeTab === 'monitor' && (
          <ImportPerformanceMonitor />
        )}
      </div>

      {/* Advanced Features */}
      <FeatureGate feature="advanced-import">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Import Avancé</h2>
          <React.Suspense fallback={<div>Chargement des fonctionnalités avancées...</div>}>
            <ImportAdvanced />
          </React.Suspense>
        </div>
      </FeatureGate>

      {/* AI Import */}
      <FeatureGate feature="ai-import">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Import IA</h2>
          <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5">
            <h3 className="font-medium mb-2">🤖 Import Intelligent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Notre IA analyse automatiquement vos fichiers et optimise les données produits.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Auto-mapping
              </span>
              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Enrichissement SEO
              </span>
              <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Détection doublons
              </span>
            </div>
          </div>
        </div>
      </FeatureGate>

      {/* Bulk Import */}
      <FeatureGate feature="bulk-import">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Import en Masse</h2>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">⚡ Traitement par lots</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Importez plusieurs fichiers simultanément avec gestion des files d'attente.
            </p>
            <div className="text-xs text-muted-foreground">
              • Jusqu'à 10 fichiers en parallèle<br/>
              • Gestion automatique des erreurs<br/>
              • Rapports détaillés d'import
            </div>
          </div>
        </div>
      </FeatureGate>

      {/* Scheduled Import */}
      <FeatureGate feature="scheduled-import">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Import Programmé</h2>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">⏰ Automatisation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Planifiez vos imports pour qu'ils s'exécutent automatiquement selon vos besoins.
            </p>
            <div className="text-xs text-muted-foreground">
              • Planification quotidienne/hebdomadaire<br/>
              • Notifications de statut<br/>
              • Historique complet des exécutions
            </div>
          </div>
        </div>
      </FeatureGate>
    </div>
  );
};

export default UnifiedImport;