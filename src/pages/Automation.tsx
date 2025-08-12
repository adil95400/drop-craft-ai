import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const [automations, setAutomations] = useState([
    {
      id: 1,
      name: "Synchronisation Prix Automatique",
      description: "Met à jour les prix des produits en fonction des fournisseurs",
      status: "active",
      trigger: "Chaque heure",
      lastRun: "Il y a 5 min",
      success: 98
    },
    {
      id: 2,
      name: "Import Produits Gagnants",
      description: "Importe automatiquement les produits tendances d'AliExpress",
      status: "active",
      trigger: "Quotidien à 08:00",
      lastRun: "Il y a 2h",
      success: 95
    },
    {
      id: 3,
      name: "Mise à jour Stock",
      description: "Vérifie et met à jour le stock disponible chez les fournisseurs",
      status: "paused",
      trigger: "Toutes les 2h",
      lastRun: "Il y a 6h",
      success: 92
    },
    {
      id: 4,
      name: "Email Abandon Panier",
      description: "Envoie des emails aux clients qui ont abandonné leur panier",
      status: "active",
      trigger: "Après 1h d'inactivité",
      lastRun: "Il y a 15 min",
      success: 87
    }
  ]);

  const workflows = [
    {
      name: "Nouveau Produit Importé",
      steps: ["Import produit", "Optimisation SEO", "Création variations", "Publication"],
      active: true
    },
    {
      name: "Commande Reçue",
      steps: ["Validation commande", "Transmission fournisseur", "Email confirmation", "Suivi colis"],
      active: true
    },
    {
      name: "Produit en Rupture",
      steps: ["Détection rupture", "Masquer produit", "Email notification", "Recherche alternative"],
      active: false
    }
  ];

  const toggleAutomation = (id: number) => {
    setAutomations(automations.map(automation => 
      automation.id === id 
        ? { ...automation, status: automation.status === "active" ? "paused" : "active" }
        : automation
    ));
  };

  const handleNewAutomation = () => {
    navigate('/automation');
    toast({
      title: "Nouvelle automation",
      description: "Assistant de création d'automation ouvert",
    });
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
            <div className="text-2xl font-bold">12</div>
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
            <div className="text-2xl font-bold">94.2%</div>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="triggers">Déclencheurs</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-6">
          <div className="grid gap-6">
            {automations.map((automation) => (
              <Card key={automation.id} className="border-border bg-card shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{automation.name}</CardTitle>
                        <CardDescription>{automation.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={automation.status === "active" ? "default" : "secondary"}>
                        {automation.status === "active" ? "Actif" : "Pausé"}
                      </Badge>
                      <Switch 
                        checked={automation.status === "active"}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                      />
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Déclencheur</div>
                      <div className="font-medium">{automation.trigger}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Dernière exécution</div>
                      <div className="font-medium">{automation.lastRun}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taux de réussite</div>
                      <div className="font-medium">{automation.success}%</div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurer
                    </Button>
                    <Button variant="outline" size="sm">
                      {automation.status === "active" ? (
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
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <div className="grid gap-6">
            {workflows.map((workflow, index) => (
              <Card key={index} className="border-border bg-card shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Workflow className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>
                          {workflow.steps.length} étapes configurées
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={workflow.active ? "default" : "secondary"}>
                        {workflow.active ? "Actif" : "Inactif"}
                      </Badge>
                      <Switch checked={workflow.active} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {workflow.steps.map((step, stepIndex) => (
                      <Badge key={stepIndex} variant="outline">
                        {stepIndex + 1}. {step}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm">
                      Tester
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Automation;