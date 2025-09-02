import React from 'react';
import { FeatureGate } from '@/components/common/FeatureGate';
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider';
import SupplierHub from '@/components/SupplierHub';

const UnifiedSuppliers: React.FC = () => {
  const { getFeatureConfig } = useUnifiedPlan();
  const config = getFeatureConfig('suppliers');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {config.title || 'Fournisseurs'}
        </h1>
        {config.features?.['premium-integrations'] && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
              ⭐ Premium
            </span>
          </div>
        )}
      </div>
      
      {/* Main Supplier Hub - Always Available */}
      <SupplierHub />

      {/* Premium Integrations */}
      <FeatureGate feature="premium-integrations">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Intégrations Premium</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5">
              <h3 className="font-medium mb-2">BigBuy Pro</h3>
              <p className="text-sm text-muted-foreground">
                Connecteur avancé avec sync automatique et gestion des stocks en temps réel.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-blue-500/5">
              <h3 className="font-medium mb-2">Cdiscount Pro</h3>
              <p className="text-sm text-muted-foreground">
                Intégration marketplace avec publication automatique et suivi des commandes.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-green-500/5">
              <h3 className="font-medium mb-2">Syncee Premium</h3>
              <p className="text-sm text-muted-foreground">
                Accès aux fournisseurs premium avec mapping automatique des produits.
              </p>
            </div>
          </div>
        </div>
      </FeatureGate>

      {/* Advanced Automation */}
      <FeatureGate feature="advanced-automation">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Automatisation Avancée</h2>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Sync Intelligent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Synchronisation automatique des catalogues avec détection des changements et mise à jour en temps réel.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                Sync Auto
              </span>
              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                Détection Prix
              </span>
              <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                Stock Temps Réel
              </span>
            </div>
          </div>
        </div>
      </FeatureGate>

      {/* Business Intelligence */}
      <FeatureGate feature="analytics-insights">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Intelligence Business</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Analyse de Performance</h3>
              <p className="text-sm text-muted-foreground">
                Insights sur la performance de vos fournisseurs avec recommandations d'optimisation.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Prédictions IA</h3>
              <p className="text-sm text-muted-foreground">
                Prédictions de stock et de demande basées sur l'historique et les tendances marché.
              </p>
            </div>
          </div>
        </div>
      </FeatureGate>
    </div>
  );
};

export default UnifiedSuppliers;