import React from 'react';
import { FeatureGate } from '@/components/common/FeatureGate';
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider';
import SupplierHub from '@/components/SupplierHub';
import { RealTimeSupplierMonitor } from '@/components/suppliers/RealTimeSupplierMonitor';
import { SupplierPerformanceAnalytics } from '@/components/suppliers/SupplierPerformanceAnalytics';
import { AutomatedSupplierWorkflows } from '@/components/suppliers/AutomatedSupplierWorkflows';

const UnifiedSuppliers: React.FC = () => {
  const { getFeatureConfig } = useUnifiedPlan();
  const config = getFeatureConfig('suppliers');
  const [activeTab, setActiveTab] = React.useState<'hub' | 'monitor' | 'analytics' | 'workflows'>('hub');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {config.title || 'Fournisseurs'}
        </h1>
        {config.features?.['supplier-analytics'] && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
              📊 Analytics Activées
            </span>
          </div>
        )}
      </div>

      {/* Supplier Method Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('hub')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'hub' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Hub Fournisseurs
        </button>
        
        <FeatureGate feature="supplier-monitoring" fallback={null} showUpgrade={false}>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'monitor' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Monitoring Temps Réel
          </button>
        </FeatureGate>
        
        <FeatureGate feature="supplier-analytics" fallback={null} showUpgrade={false}>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'analytics' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Analytics Performance
          </button>
        </FeatureGate>
        
        <FeatureGate feature="automation" fallback={null} showUpgrade={false}>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'workflows' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Workflows Automatisés
          </button>
        </FeatureGate>
      </div>
      
      {/* Content */}
      {activeTab === 'hub' && <SupplierHub />}
      {activeTab === 'monitor' && <RealTimeSupplierMonitor />}
      {activeTab === 'analytics' && <SupplierPerformanceAnalytics />}
      {activeTab === 'workflows' && <AutomatedSupplierWorkflows />}
    </div>
  );
};

export default UnifiedSuppliers;