import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck,
  Plane,
  Ship,
  RefreshCw,
  Copy,
  ExternalLink,
  Filter
} from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";

const Tracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResults, setTrackingResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleTrackPackage = async () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un numéro de suivi",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);
    
    // Simulate API call to 17track
    setTimeout(() => {
      const mockResult = {
        trackingNumber: trackingNumber,
        carrier: "China Post",
        status: "in_transit",
        currentLocation: "Paris, France",
        destination: "Lyon, France",
        estimatedDelivery: "2024-01-15",
        events: [
          {
            date: "2024-01-10 14:30",
            location: "Paris CDG Airport",
            status: "Arrived at destination country",
            icon: Plane
          },
          {
            date: "2024-01-09 08:15",
            location: "Shanghai, China",
            status: "Departed from origin country",
            icon: Plane
          },
          {
            date: "2024-01-08 16:45",
            location: "Shanghai Sorting Center",
            status: "Package sorted",
            icon: Package
          },
          {
            date: "2024-01-08 10:20",
            location: "Shenzhen, China",
            status: "Package shipped",
            icon: Truck
          }
        ]
      };

      setTrackingResults([mockResult]);
      setIsTracking(false);
      
      toast({
        title: "Suivi trouvé !",
        description: "Informations de livraison mises à jour",
      });
    }, 2000);
  };

  const recentTrackings = [
    {
      id: "LP123456789CN",
      customer: "Marie Dubois",
      product: "iPhone Case",
      status: "delivered",
      carrier: "La Poste",
      date: "2024-01-12",
      location: "Lyon, France"
    },
    {
      id: "1Z999AA1234567890",
      customer: "Pierre Martin",
      product: "Wireless Headphones",
      status: "in_transit", 
      carrier: "UPS",
      date: "2024-01-11",
      location: "Paris, France"
    },
    {
      id: "CP123456789US",
      customer: "Sophie Laurent",
      product: "Smart Watch",
      status: "exception",
      carrier: "China Post",
      date: "2024-01-10",
      location: "Customs Office"
    },
    {
      id: "DHL123456789",
      customer: "Thomas Bernard",
      product: "Gaming Mouse",
      status: "delivered",
      carrier: "DHL",
      date: "2024-01-09",
      location: "Marseille, France"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "text-green-600 bg-green-100";
      case "in_transit": return "text-blue-600 bg-blue-100";
      case "exception": return "text-red-600 bg-red-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered": return "Livré";
      case "in_transit": return "En transit";
      case "exception": return "Problème";
      case "pending": return "En attente";
      default: return "Inconnu";
    }
  };

  const carriers = [
    { name: "17Track", logo: "📦", active: true, packages: "2.1M+" },
    { name: "China Post", logo: "🇨🇳", active: true, packages: "500K+" },
    { name: "La Poste", logo: "🇫🇷", active: true, packages: "300K+" },
    { name: "DHL", logo: "📮", active: true, packages: "200K+" },
    { name: "UPS", logo: "🚚", active: true, packages: "150K+" },
    { name: "FedEx", logo: "✈️", active: true, packages: "120K+" }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Suivi des Colis
          </h1>
          <p className="text-muted-foreground mt-1">
            Trackez vos commandes en temps réel avec 17track.net
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </Button>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side - Tracking Interface */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tracking Search */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Rechercher un Colis
              </CardTitle>
              <CardDescription>
                Entrez le numéro de suivi pour obtenir les informations en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="tracking-number">Numéro de suivi</Label>
                  <Input
                    id="tracking-number"
                    placeholder="LP123456789CN, 1Z999AA1234567890..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTrackPackage()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleTrackPackage}
                    disabled={isTracking}
                    variant="hero"
                  >
                    {isTracking ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Tracker
                  </Button>
                </div>
              </div>

              {isTracking && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">Recherche en cours sur 17track.net...</span>
                  </div>
                  <Progress value={66} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {trackingResults.map((result, index) => (
            <Card key={index} className="border-border bg-card shadow-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      {result.trackingNumber}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        {result.carrier}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {result.currentLocation}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Status Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Statut</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">En transit</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Position actuelle</div>
                      <div className="font-medium mt-1">{result.currentLocation}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Livraison estimée</div>
                      <div className="font-medium mt-1">{result.estimatedDelivery}</div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Historique de livraison</h4>
                  <div className="space-y-4">
                    {result.events.map((event: any, eventIndex: number) => (
                      <div key={eventIndex} className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <event.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{event.status}</div>
                            <div className="text-sm text-muted-foreground">{event.date}</div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{event.location}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Recent Trackings */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Suivis Récents</CardTitle>
              <CardDescription>Dernières commandes trackées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrackings.map((tracking, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-card transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{tracking.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {tracking.customer} • {tracking.product}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {tracking.carrier} • {tracking.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={getStatusColor(tracking.status)}>
                        {getStatusText(tracking.status)}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {tracking.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Stats & Settings */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Colis trackés</span>
                <span className="font-semibold">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Livrés ce mois</span>
                <span className="font-semibold text-green-600">892</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">En transit</span>
                <span className="font-semibold text-blue-600">234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Délai moyen</span>
                <span className="font-semibold">12.5 jours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taux de livraison</span>
                <span className="font-semibold text-green-600">96.8%</span>
              </div>
            </CardContent>
          </Card>

          {/* Carriers */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Transporteurs</CardTitle>
              <CardDescription>Intégrations actives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {carriers.map((carrier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{carrier.logo}</span>
                      <div>
                        <div className="font-medium">{carrier.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {carrier.packages} colis
                        </div>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser tous les colis
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Notifications automatiques
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Configurer webhooks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppLayout>
  );
};

export default Tracking;