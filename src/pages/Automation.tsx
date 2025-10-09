import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRealAutomation } from "@/hooks/useRealAutomation";
import { AutomationConfigDialog } from "@/components/automation/AutomationConfigDialog";
import { AutomationOptionsMenu } from "@/components/automation/AutomationOptionsMenu";
import { SmartDataProcessor } from "@/components/automation/SmartDataProcessor";
import { IntelligentWorkflows } from "@/components/automation/IntelligentWorkflows";
import { AIOptimizationEngine } from "@/components/automation/AIOptimizationEngine";
import { RealtimeActivityFeed } from "@/components/automation/RealtimeActivityFeed";

import { 
  Zap, 
  Settings, 
  Play, 
  Pause,
  Plus,
  MoreVertical,
  Clock,
  Target,
  TrendingUp,
  Bot,
  Workflow,
  Mail,
  ShoppingCart
} from "lucide-react";

const Automation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workflows, stats, isLoading, updateWorkflow } = useRealAutomation();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [newAutomationDialogOpen, setNewAutomationDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  
  
  const toggleAutomation = async (id: string) => {
    const workflow = workflows.find(w => w.id === id);
    if (!workflow) return;

    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    
    updateWorkflow({ 
      id, 
      updates: { status: newStatus } 
    });
  };

  const handleNewAutomation = () => {
    setNewAutomationDialogOpen(true);
  };

  const handleConfigure = (automationId: string) => {
    const automation = workflows.find(a => a.id === automationId);
    if (automation) {
      setSelectedAutomation(automation);
      setConfigDialogOpen(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            Automatisez vos processus de dropshipping
          </p>
        </div>
        <Button variant="hero" onClick={handleNewAutomation}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Automations Actives
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 12}</div>
            <p className="text-xs text-muted-foreground">+2 ce mois</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de Réussite
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate || 94.2}%</div>
            <p className="text-xs text-muted-foreground">+1.2% ce mois</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Temps Économisé
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47h</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actions Exécutées
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="automations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="ai-engine">IA Engine</TabsTrigger>
          <TabsTrigger value="data-processor">Traitement</TabsTrigger>
          <TabsTrigger value="triggers">Déclencheurs</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : workflows.length === 0 ? (
            <Card className="border-border bg-card shadow-card">
              <CardContent className="p-12 text-center">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune automation</h3>
                <p className="text-muted-foreground mb-4">Créez votre première automation pour commencer</p>
                <Button onClick={handleNewAutomation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Automation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="border-border bg-card shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <CardDescription>{workflow.description || 'Workflow d\'automatisation'}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
                          {workflow.status === "active" ? "Actif" : workflow.status === "paused" ? "Pausé" : "Brouillon"}
                        </Badge>
                        <Switch 
                          checked={workflow.status === "active"}
                          onCheckedChange={() => toggleAutomation(workflow.id)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleConfigure(workflow.id)}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Déclencheur</div>
                        <div className="font-medium">{workflow.trigger_type || 'Manuel'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Dernière exécution</div>
                        <div className="font-medium">
                          {workflow.last_executed_at 
                            ? new Date(workflow.last_executed_at).toLocaleString('fr-FR')
                            : 'Jamais'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Taux de réussite</div>
                        <div className="font-medium">
                          {workflow.execution_count > 0 
                            ? Math.round((workflow.success_count / workflow.execution_count) * 100)
                            : 0
                          }%
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleConfigure(workflow.id)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configurer
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleAutomation(workflow.id)}>
                        {workflow.status === "active" ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Démarrer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <IntelligentWorkflows />
        </TabsContent>

        <TabsContent value="ai-engine" className="space-y-6">
          <AIOptimizationEngine />
        </TabsContent>

        <TabsContent value="data-processor" className="space-y-6">
          <SmartDataProcessor />
        </TabsContent>

        <TabsContent value="triggers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Déclencheurs Temporels
                  </CardTitle>
                  <CardDescription>Automations basées sur le temps</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium">Quotidien</div>
                      <div className="text-sm text-muted-foreground">5 automations</div>
                    </div>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium">Horaire</div>
                      <div className="text-sm text-muted-foreground">3 automations</div>
                    </div>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium">Hebdomadaire</div>
                      <div className="text-sm text-muted-foreground">2 automations</div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" />
                    Déclencheurs d'Événements
                  </CardTitle>
                  <CardDescription>Automations basées sur les actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Nouvelle commande</div>
                        <div className="text-sm text-muted-foreground">4 automations</div>
                      </div>
                    </div>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Abandon panier</div>
                        <div className="text-sm text-muted-foreground">2 automations</div>
                      </div>
                    </div>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Produit populaire</div>
                        <div className="text-sm text-muted-foreground">1 automation</div>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <RealtimeActivityFeed />
          </div>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      {selectedAutomation && (
        <AutomationConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          automation={selectedAutomation}
        />
      )}
    </div>
  );
};

export default Automation;