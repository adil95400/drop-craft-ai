import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileText, Globe, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const TaxManagementPage: React.FC = () => {
  const taxRates = [
    { id: 1, country: 'France', rate: 20, type: 'TVA', status: 'active' },
    { id: 2, country: 'Belgique', rate: 21, type: 'TVA', status: 'active' },
    { id: 3, country: 'Suisse', rate: 7.7, type: 'TVA', status: 'active' },
  ];

  const reports = [
    { period: 'T4 2024', amount: 12456, status: 'completed', dueDate: '2024-01-31' },
    { period: 'T3 2024', amount: 10234, status: 'completed', dueDate: '2023-10-31' },
    { period: 'T2 2024', amount: 11890, status: 'completed', dueDate: '2023-07-31' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion fiscale</h1>
          <p className="text-muted-foreground">
            Gérez vos taxes et obligations fiscales
          </p>
        </div>
        <Button>
          <Calculator className="mr-2 h-4 w-4" />
          Calculer les taxes
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVA collectée</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€3,456</div>
            <p className="text-xs text-muted-foreground">Ce trimestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVA déductible</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€1,234</div>
            <p className="text-xs text-muted-foreground">Ce trimestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVA à payer</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2,222</div>
            <p className="text-xs text-muted-foreground">Échéance: 31/03/2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pays actifs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Zones de taxation</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rates">Taux de TVA</TabsTrigger>
          <TabsTrigger value="reports">Déclarations</TabsTrigger>
          <TabsTrigger value="rules">Règles fiscales</TabsTrigger>
          <TabsTrigger value="exemptions">Exonérations</TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Taux de TVA par pays</CardTitle>
              <CardDescription>Configurez les taux applicables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxRates.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{rate.country}</h3>
                        <p className="text-sm text-muted-foreground">{rate.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{rate.rate}%</div>
                      </div>
                      <Badge variant="default">{rate.status}</Badge>
                      <Button size="sm" variant="outline">
                        Modifier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="mt-4" variant="outline">
                <Globe className="mr-2 h-4 w-4" />
                Ajouter un pays
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taux réduits</CardTitle>
              <CardDescription>Catégories de produits avec taux réduit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Livres et publications</h4>
                      <p className="text-sm text-muted-foreground">France</p>
                    </div>
                    <Badge variant="secondary">5.5%</Badge>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Produits alimentaires</h4>
                      <p className="text-sm text-muted-foreground">France</p>
                    </div>
                    <Badge variant="secondary">5.5%</Badge>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Médicaments</h4>
                      <p className="text-sm text-muted-foreground">France</p>
                    </div>
                    <Badge variant="secondary">2.1%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Déclarations de TVA</CardTitle>
              <CardDescription>Historique et échéances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.period}</h3>
                        <p className="text-sm text-muted-foreground">
                          Échéance: {report.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">€{report.amount}</div>
                        <div className="text-xs text-muted-foreground">TVA collectée</div>
                      </div>
                      <Badge variant="outline">{report.status}</Badge>
                      <Button size="sm" variant="outline">
                        Télécharger
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Règles fiscales automatiques</CardTitle>
              <CardDescription>Automatisation du calcul des taxes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Géolocalisation automatique</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Applique automatiquement le taux de TVA selon le pays du client
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Numéro de TVA intracommunautaire</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Vérifie et exonère la TVA pour les entreprises européennes
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Seuil de franchise</h4>
                    <Badge variant="secondary">Inactif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gestion du seuil de franchise en base de TVA
                  </p>
                  <Button size="sm" variant="outline">Activer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exemptions">
          <Card>
            <CardHeader>
              <CardTitle>Exonérations de TVA</CardTitle>
              <CardDescription>Cas particuliers d'exonération</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-semibold">Export hors UE</h4>
                    <p className="text-sm text-muted-foreground">
                      Exonération automatique pour les expéditions hors Union Européenne
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-semibold">Livraisons intracommunautaires</h4>
                    <p className="text-sm text-muted-foreground">
                      Exonération pour les ventes B2B au sein de l'UE avec numéro de TVA valide
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxManagementPage;
