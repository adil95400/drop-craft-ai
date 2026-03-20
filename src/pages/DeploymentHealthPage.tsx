import { ChannablePageWrapper } from "@/components/channable/ChannablePageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Cloud, Database, HardDrive, RefreshCw, Rocket, Shield, RotateCcw } from "lucide-react";
import { useDeploymentStatus, useDatabaseHealth, useBackupVerification, useEnvironmentAudit, useRollbackCheck } from "@/hooks/useDeploymentHealth";
import { Skeleton } from "@/components/ui/skeleton";

const priorityColors: Record<string, string> = {
  high: "bg-red-500/15 text-red-700",
  medium: "bg-amber-500/15 text-amber-700",
  low: "bg-blue-500/15 text-blue-700",
};

export default function DeploymentHealthPage() {
  const { data: deploy, isLoading: deployLoading, refetch } = useDeploymentStatus();
  const { data: dbHealth } = useDatabaseHealth();
  const { data: backups } = useBackupVerification();
  const { data: envAudit } = useEnvironmentAudit();
  const { data: rollback } = useRollbackCheck();

  return (
    <ChannablePageWrapper title="Déploiement & Infrastructure">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              Déploiement & Infrastructure
            </h1>
            <p className="text-muted-foreground mt-1">Santé du déploiement, backups et audit de sécurité</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
          </Button>
        </div>

        {/* Status Banner */}
        {deployLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : deploy ? (
          <Card className="border-l-4" style={{ borderLeftColor: deploy.status === "healthy" ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
            <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Cloud className={`h-8 w-8 ${deploy.status === "healthy" ? "text-success" : "text-destructive"}`} />
                <div>
                  <p className="text-lg font-semibold">
                    Infrastructure {deploy.status === "healthy" ? "saine" : "dégradée"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    v{deploy.version} • {deploy.environment?.platform} • {deploy.environment?.region}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {new Date(deploy.timestamp).toLocaleString("fr-FR")}
              </Badge>
            </CardContent>
          </Card>
        ) : null}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10"><Database className="h-5 w-5 text-info" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Tables DB</p>
                  <p className="text-2xl font-bold">{dbHealth?.tables?.length ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{dbHealth?.overall_status === "healthy" ? "✅ Toutes ok" : "⚠️ Problèmes"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><Shield className="h-5 w-5 text-success" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Score sécurité</p>
                  <p className="text-2xl font-bold">{envAudit?.security_score ?? "—"}%</p>
                  <p className="text-xs text-muted-foreground">
                    {envAudit?.security_checks?.filter((c: any) => c.status === "pass").length ?? 0}/{envAudit?.security_checks?.length ?? 0} checks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10"><HardDrive className="h-5 w-5 text-purple-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Backups</p>
                  <p className="text-2xl font-bold">{backups?.backup_type ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Rétention : {backups?.retention_days ?? 7}j</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><RotateCcw className="h-5 w-5 text-warning" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Rollback</p>
                  <p className="text-2xl font-bold">{rollback?.rollback_safe ? "Prêt" : "Risqué"}</p>
                  <p className="text-xs text-muted-foreground">{rollback?.data_at_risk?.total_records_at_risk ?? 0} enregistrements à risque</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="database">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="database">Base de données</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="functions">Functions</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Santé des tables</CardTitle>
                <CardDescription>
                  RLS : {dbHealth?.integrity?.rls_coverage ?? "100%"} • Données orphelines : {dbHealth?.integrity?.orphaned_orders ?? 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(dbHealth?.tables || []).map((t: any) => (
                    <div key={t.table} className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium font-mono">{t.table}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{t.row_count.toLocaleString()} lignes</span>
                        <Badge variant="outline" className={t.accessible ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"}>
                          {t.accessible ? <><CheckCircle2 className="h-3 w-3 mr-1" /> OK</> : <><AlertTriangle className="h-3 w-3 mr-1" /> Erreur</>}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!dbHealth?.tables || dbHealth.tables.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">Chargement...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audit de sécurité</CardTitle>
                <CardDescription>Score : {envAudit?.security_score ?? 0}% • {envAudit?.recommendations?.length ?? 0} recommandations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Security checks */}
                <div className="space-y-2">
                  {(envAudit?.security_checks || []).map((check: any) => (
                    <div key={check.check} className="flex items-center justify-between py-2 px-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {check.status === "pass" ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm">{check.detail}</span>
                      </div>
                      <Badge variant="outline" className={check.status === "pass" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"}>
                        {check.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {(envAudit?.recommendations || []).length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium">Recommandations</p>
                    {envAudit.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 py-2 px-3 rounded-lg bg-muted/30">
                        <Badge variant="outline" className={`text-xs shrink-0 ${priorityColors[rec.priority] || ""}`}>
                          {rec.priority}
                        </Badge>
                        <span className="text-sm">{rec.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* API Keys summary */}
                {envAudit?.api_keys && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Clés API</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-bold">{envAudit.api_keys.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-bold">{envAudit.api_keys.active}</p>
                        <p className="text-xs text-muted-foreground">Actives</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-bold text-destructive">{envAudit.api_keys.expired}</p>
                        <p className="text-xs text-muted-foreground">Expirées</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-bold text-warning">{envAudit.api_keys.unused}</p>
                        <p className="text-xs text-muted-foreground">Inutilisées</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backups" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stratégie de sauvegarde</CardTitle>
                <CardDescription>Sauvegarde continue avec restauration point-in-time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-card text-center">
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="text-lg font-bold capitalize">{backups?.backup_type ?? "—"}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card text-center">
                    <p className="text-sm text-muted-foreground">PITR</p>
                    <p className="text-lg font-bold">{backups?.pitr_enabled ? "✅ Activé" : "❌"}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card text-center">
                    <p className="text-sm text-muted-foreground">Rétention</p>
                    <p className="text-lg font-bold">{backups?.retention_days ?? 7} jours</p>
                  </div>
                </div>

                {(backups?.recommendations || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recommandations</p>
                    {backups.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 py-2 px-3 rounded-lg bg-muted/30">
                        <Badge variant="outline" className={`text-xs shrink-0 ${priorityColors[rec.priority] || ""}`}>
                          {rec.priority}
                        </Badge>
                        <span className="text-sm">{rec.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edge Functions déployées</CardTitle>
                <CardDescription>{deploy?.edge_functions?.length ?? 0} fonctions actives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(deploy?.edge_functions || []).map((fn: any) => (
                    <div key={fn.name} className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
                      <span className="font-mono text-sm">{fn.name}</span>
                      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {fn.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ChannablePageWrapper>
  );
}
