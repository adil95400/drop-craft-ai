import React from 'react';
import { FeatureGate } from '@/components/common/FeatureGate';
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider';

// Lazy load the actual import components
const ImportBasic = React.lazy(() => import('./Import'));
const ImportAdvanced = React.lazy(() => import('./ImportAdvanced'));

const UnifiedImport: React.FC = () => {
  const { getFeatureConfig } = useUnifiedPlan();
  const config = getFeatureConfig('import');

  return (
    <div className="space-y-6">
      {/* Main Import Interface */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{config.title}</h1>
          {config.features['ai-import'] && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                🤖 IA Activée
              </span>
            </div>
          )}
        </div>
        
        {/* Basic Import - Always Available */}
        <React.Suspense fallback={<div>Chargement...</div>}>
          <ImportBasic />
        </React.Suspense>
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
            <p className="text-sm text-muted-foreground">
              Fonctionnalités d'import automatisé avec IA disponibles
            </p>
          </div>
        </div>
      </FeatureGate>

      {/* Bulk Import */}
      <FeatureGate feature="bulk-import">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Import en Masse</h2>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Interface d'import en masse pour traiter plusieurs fichiers simultanément.
            </p>
          </div>
        </div>
      </FeatureGate>

      {/* Scheduled Import */}
      <FeatureGate feature="scheduled-import">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Import Programmé</h2>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Planifiez vos imports pour qu'ils s'exécutent automatiquement.
            </p>
          </div>
        </div>
      </FeatureGate>
    </div>
  );
};

export default UnifiedImport;