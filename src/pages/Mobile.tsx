import { useState } from "react";
import { Smartphone, Download, QrCode, Bell, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Mobile() {
  const [appDownloads, setAppDownloads] = useState(12847);

  const features = [
    {
      title: "Dashboard Mobile",
      description: "Suivez vos KPIs en temps réel",
      icon: TrendingUp,
      status: "Disponible"
    },
    {
      title: "Import Rapide",
      description: "Scannez et ajoutez des produits",
      icon: QrCode,
      status: "Disponible"
    },
    {
      title: "Notifications Push",
      description: "Alertes commandes et stocks",
      icon: Bell,
      status: "Disponible"
    }
  ];

  const extensionStats = [
    { browser: "Chrome", installs: "8,547", rating: "4.8" },
    { browser: "Firefox", installs: "2,341", rating: "4.7" },
    { browser: "Safari", installs: "1,156", rating: "4.6" }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mobile & Extensions</h1>
          <p className="text-muted-foreground">Applications mobiles et extensions navigateur</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <QrCode className="w-4 h-4 mr-2" />
            QR Code App
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Téléchargements App</p>
                <p className="text-2xl font-bold">{appDownloads.toLocaleString()}</p>
              </div>
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Extensions Actives</p>
                <p className="text-2xl font-bold">12,044</p>
              </div>
              <Download className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Note Moyenne</p>
                <p className="text-2xl font-bold">4.7</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">⭐</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Imports/Jour</p>
                <p className="text-2xl font-bold">2,341</p>
              </div>
              <QrCode className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mobile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mobile">App Mobile</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
        </TabsList>

        <TabsContent value="mobile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* App Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Shopopti Pro Mobile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Shopopti Pro</h3>
                        <p className="text-sm opacity-90">Dropshipping Management</p>
                      </div>
                    </div>
                    <p className="text-sm opacity-90 mb-4">
                      Gérez votre business dropshipping partout, à tout moment.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        iOS
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Android
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">4.8</div>
                      <div className="text-sm text-muted-foreground">Note App Store</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">50K+</div>
                      <div className="text-sm text-muted-foreground">Téléchargements</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités Mobile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Badge variant="outline">{feature.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="extensions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Extension Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Extensions Navigateur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extensionStats.map((ext, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                          🌐
                        </div>
                        <div>
                          <h4 className="font-semibold">{ext.browser}</h4>
                          <p className="text-sm text-muted-foreground">{ext.installs} installations</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">⭐</span>
                          <span className="font-semibold">{ext.rating}</span>
                        </div>
                        <Button size="sm" variant="outline">Installer</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Extension Features */}
            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités Extension</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Import en 1 clic</h4>
                    <p className="text-sm text-blue-700">
                      Importez n'importe quel produit depuis AliExpress, Amazon, etc. en un seul clic.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Analyse Concurrentielle</h4>
                    <p className="text-sm text-green-700">
                      Analysez automatiquement les prix et données des concurrents.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Détection Winners</h4>
                    <p className="text-sm text-purple-700">
                      Détectez les produits tendance et winners automatiquement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Roadmap Mobile & Extensions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold">✅ Scanner QR Produits</h4>
                    <p className="text-sm text-muted-foreground">Scannez des QR codes pour ajouter des produits</p>
                  </div>
                  <Badge>Disponible</Badge>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold">🔄 Mode Hors-ligne</h4>
                    <p className="text-sm text-muted-foreground">Synchronisation automatique quand la connexion revient</p>
                  </div>
                  <Badge variant="outline">En développement</Badge>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold">📱 Widget iOS/Android</h4>
                    <p className="text-sm text-muted-foreground">Widget dashboard sur l'écran d'accueil</p>
                  </div>
                  <Badge variant="secondary">Q2 2024</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}