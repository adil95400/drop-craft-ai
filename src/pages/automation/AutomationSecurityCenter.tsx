import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { AuditLogViewer } from '@/components/automation/security/AuditLogViewer';
import { ErrorRetryDashboard } from '@/components/automation/security/ErrorRetryDashboard';
import { SecurityOverview } from '@/components/automation/security/SecurityOverview';

export default function AutomationSecurityCenter() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Sécurité & Audit
        </h1>
        <p className="text-muted-foreground mt-1">
          Traçabilité, gestion d'erreurs et contrôle d'accès des automatisations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Journal d'audit
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Erreurs & Retry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SecurityOverview />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorRetryDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
