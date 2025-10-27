import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';
import { AuditTrailViewer } from '@/components/compliance/AuditTrailViewer';
import { GlobalInsightsDashboard } from '@/components/global/GlobalInsightsDashboard';
import { Globe, Shield, Activity, TrendingUp } from 'lucide-react';

export default function GlobalIntelligencePage() {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Global Intelligence & Compliance
          </h1>
          <p className="text-muted-foreground text-lg">
            Enterprise-grade compliance monitoring and global market insights
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Global Insights
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            <GlobalInsightsDashboard />
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <ComplianceDashboard />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditTrailViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
