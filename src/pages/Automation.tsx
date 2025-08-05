import { useState } from "react";
import { Bot, Zap, Brain, Wand2, MessageSquare, Image, Globe, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function Automation() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const automations = [
    {
      name: "Génération Produits IA",
      description: "Création automatique de fiches produits complètes",
      icon: <Wand2 className="w-5 h-5" />,
      status: "active",
      executions: 1247
    },
    {
      name: "Traduction Automatique",
      description: "Traduction multi-langue en temps réel",
      icon: <Globe className="w-5 h-5" />,
      status: "active", 
      executions: 892
    },
    {
      name: "Génération Images IA",
      description: "Création d'images produits avec DALL-E",
      icon: <Image className="w-5 h-5" />,
      status: "active",
      executions: 456
    },
    {
      name: "Coach IA 24/7",
      description: "Assistant personnel pour optimisations",
      icon: <MessageSquare className="w-5 h-5" />,
      status: "active",
      executions: 2341
    }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automatisation IA</h1>
          <p className="text-muted-foreground">Automatisez votre business avec l'intelligence artificielle</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Brain className="w-4 h-4 mr-2" />
            Coach IA
          </Button>
          <Button>
            <Bot className="w-4 h-4 mr-2" />
            Nouvelle Automation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automations Actives</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exécutions/Mois</p>
                <p className="text-2xl font-bold">4,936</p>
              </div>
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps Économisé</p>
                <p className="text-2xl font-bold">234h</p>
              </div>
              <Brain className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score IA</p>
                <p className="text-2xl font-bold">98%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Générateur IA</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="coach">Coach IA</TabsTrigger>
          <TabsTrigger value="audit">Audit IA</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Générateur IA Universel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Décrivez ce que vous voulez générer (produit, description, campagne email, landing page...)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Bot className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Générer avec IA
                    </>
                  )}
                </Button>
                <Button variant="outline">Templates</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-4 text-center space-y-2">
                <Wand2 className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold">Fiche Produit</h3>
                <p className="text-sm text-muted-foreground">Titre, description, SEO</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-4 text-center space-y-2">
                <Image className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold">Images IA</h3>
                <p className="text-sm text-muted-foreground">DALL-E, fonds blancs</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-4 text-center space-y-2">
                <Globe className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold">Landing Page</h3>
                <p className="text-sm text-muted-foreground">Page optimisée SEO</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          <div className="grid gap-4">
            {automations.map((automation, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {automation.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{automation.name}</h3>
                        <p className="text-sm text-muted-foreground">{automation.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Exécutions</p>
                        <p className="font-semibold">{automation.executions.toLocaleString()}</p>
                      </div>
                      <Badge variant={automation.status === "active" ? "default" : "secondary"}>
                        {automation.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configurer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coach" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Coach IA Personnel 24/7
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600 rounded-full">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Recommandation du jour :</strong> Vos produits "smartphone" performent bien. 
                        Je recommande d'ajouter des accessoires complémentaires pour augmenter le panier moyen.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-600 rounded-full">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-800">
                        <strong>Opportunité détectée :</strong> Le taux de conversion de votre page "montres" 
                        peut être amélioré en optimisant les descriptions produits.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discuter avec le Coach IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit IA de vos Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">iPhone 15 Pro</h4>
                    <p className="text-sm text-muted-foreground">Dernière analyse il y a 2h</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">87%</div>
                    <p className="text-sm text-muted-foreground">Score qualité</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Casque Bluetooth</h4>
                    <p className="text-sm text-muted-foreground">Dernière analyse il y a 5h</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">64%</div>
                    <p className="text-sm text-muted-foreground">Score qualité</p>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  Lancer Audit Complet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}