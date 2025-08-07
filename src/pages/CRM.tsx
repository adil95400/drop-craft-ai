import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/layouts/AppLayout";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Target,
  TrendingUp,
  Eye
} from "lucide-react";

const CRM = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const customers = [
    {
      id: 1,
      name: "Marie Dubois",
      email: "marie.dubois@email.com",
      phone: "+33 6 12 34 56 78",
      location: "Paris, France",
      avatar: "",
      totalOrders: 12,
      totalSpent: 2847,
      lastOrder: "Il y a 3 jours",
      status: "VIP",
      segment: "Gold",
      satisfaction: 4.8
    },
    {
      id: 2,
      name: "Pierre Martin",
      email: "pierre.martin@gmail.com",
      phone: "+33 6 87 65 43 21",
      location: "Lyon, France",
      avatar: "",
      totalOrders: 8,
      totalSpent: 1567,
      lastOrder: "Il y a 1 semaine",
      status: "Actif",
      segment: "Silver",
      satisfaction: 4.5
    },
    {
      id: 3,
      name: "Sophie Leclerc",
      email: "sophie.leclerc@outlook.com",
      phone: "+33 7 11 22 33 44",
      location: "Marseille, France",
      avatar: "",
      totalOrders: 15,
      totalSpent: 3421,
      lastOrder: "Hier",
      status: "VIP",
      segment: "Platinum",
      satisfaction: 4.9
    }
  ];

  const segments = [
    { name: "Platinum", count: 45, color: "bg-purple-500", revenue: "€89,420" },
    { name: "Gold", count: 127, color: "bg-yellow-500", revenue: "€67,890" },
    { name: "Silver", count: 289, color: "bg-gray-400", revenue: "€34,567" },
    { name: "Bronze", count: 456, color: "bg-orange-600", revenue: "€12,345" }
  ];

  const stats = [
    { title: "Total Clients", value: "2,847", change: "+12.5%", icon: Users },
    { title: "Clients Actifs", value: "1,234", change: "+8.2%", icon: Target },
    { title: "Satisfaction", value: "4.7/5", change: "+0.3", icon: Star },
    { title: "Rétention", value: "87%", change: "+5.1%", icon: TrendingUp }
  ];

  const handleNewCustomer = () => {
    toast({
      title: "Nouveau client",
      description: "Ouverture du formulaire de création de client",
    });
    
    // Simulate customer creation
    setTimeout(() => {
      toast({
        title: "Client créé",
        description: "Le nouveau client a été ajouté avec succès",
      });
    }, 2000);
  };

  const handleViewCustomer = (customerName: string) => {
    toast({
      title: "Profil client",
      description: `Ouverture du profil de ${customerName}`,
    });
  };

  const handleContactCustomer = (customerName: string, customerEmail: string) => {
    toast({
      title: "Contact client",
      description: `Ouverture de l'interface de communication avec ${customerName}`,
    });
  };

  const handleCustomerActions = (customerName: string) => {
    toast({
      title: "Actions client",
      description: `Menu d'actions pour ${customerName} ouvert`,
    });
  };

  const handleFilterCustomers = () => {
    toast({
      title: "Filtres avancés",
      description: "Configuration des filtres de recherche",
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            CRM
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion de la relation client
          </p>
        </div>
        <Button variant="hero" onClick={handleNewCustomer}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-500">{stat.change} vs mois dernier</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          {/* Search and Filters */}
          <Card className="border-border bg-card shadow-card">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={handleFilterCustomers}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filtres
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customers List */}
          <div className="grid gap-4">
            {customers.map((customer) => (
              <Card key={customer.id} className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={customer.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{customer.name}</h3>
                          <Badge variant={customer.status === "VIP" ? "default" : "secondary"}>
                            {customer.status}
                          </Badge>
                          <Badge variant="outline">{customer.segment}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {customer.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Commandes</div>
                        <div className="font-semibold">{customer.totalOrders}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total dépensé</div>
                        <div className="font-semibold">€{customer.totalSpent.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Satisfaction</div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{customer.satisfaction}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Dernière commande</div>
                        <div className="font-semibold">{customer.lastOrder}</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewCustomer(customer.name)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleContactCustomer(customer.name, customer.email)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCustomerActions(customer.name)}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {segments.map((segment, index) => (
              <Card key={index} className="border-border bg-card shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
                      {segment.name}
                    </CardTitle>
                    <Badge variant="outline">{segment.count}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{segment.revenue}</div>
                    <div className="text-sm text-muted-foreground">Revenus générés</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Répartition des Segments</CardTitle>
              <CardDescription>Distribution des clients par segment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Graphique de répartition (Chart.js/Recharts)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Évolution des clients</CardTitle>
                <CardDescription>Nouveaux clients par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Graphique d'évolution (Chart.js/Recharts)
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Taux de rétention</CardTitle>
                <CardDescription>Fidélité client par cohorte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Graphique de rétention (Chart.js/Recharts)
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
};

export default CRM;