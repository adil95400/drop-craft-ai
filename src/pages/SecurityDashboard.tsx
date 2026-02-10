import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertTriangle, CheckCircle2, Eye, Key } from "lucide-react";
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function SecurityDashboard() {
  return (
    <ChannablePageWrapper
      title="Sécurité Avancée"
      description="Sécurité et conformité enterprise"
      heroImage="settings"
      badge={{ label: 'Ultra Pro', icon: Shield }}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Score sécurité</p>
              <p className="text-2xl font-bold">95/100</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Politiques actives</p>
              <p className="text-2xl font-bold">18</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertes</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Logs audit</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Fonctionnalités de sécurité</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Monitoring de sécurité</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Surveillance en temps réel des menaces
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Audit logs</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Traçabilité complète des actions utilisateurs
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Contrôle d'accès</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Gestion avancée des permissions et rôles
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium">3 alertes nécessitent votre attention</p>
          </div>
          <div className="flex gap-3">
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Voir les alertes
            </Button>
            <Button variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Gérer les accès
            </Button>
          </div>
        </div>
      </Card>
    </ChannablePageWrapper>
  );
}
