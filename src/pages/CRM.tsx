import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Mail, 
  Phone, 
  Tag,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MessageSquare,
  Calendar,
  Target,
  TrendingUp,
  DollarSign,
  Zap
} from "lucide-react";

const CRM = () => {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { toast } = useToast();

  const contacts = [
    {
      id: 1,
      name: "Marie Dubois",
      email: "marie.dubois@gmail.com",
      phone: "+33 6 12 34 56 78",
      status: "client",
      tags: ["VIP", "Electronics"],
      totalSpent: 1240,
      lastOrder: "2024-01-12",
      orders: 8,
      source: "Google Ads",
      score: 95
    },
    {
      id: 2,
      name: "Pierre Martin",
      email: "pierre.martin@outlook.fr",
      phone: "+33 6 98 76 54 32",
      status: "prospect",
      tags: ["Hot Lead", "Fashion"],
      totalSpent: 0,
      lastOrder: null,
      orders: 0,
      source: "Facebook",
      score: 78
    },
    {
      id: 3,
      name: "Sophie Laurent",
      email: "sophie.laurent@yahoo.com",
      phone: "+33 6 11 22 33 44",
      status: "lead",
      tags: ["Beauty", "Newsletter"],
      totalSpent: 89,
      lastOrder: "2024-01-10",
      orders: 1,
      source: "Organic",
      score: 65
    },
    {
      id: 4,
      name: "Thomas Bernard",
      email: "thomas.bernard@gmail.com",
      phone: "+33 6 55 66 77 88",
      status: "client",
      tags: ["Loyal", "Gaming"],
      totalSpent: 890,
      lastOrder: "2024-01-08",
      orders: 12,
      source: "Referral",
      score: 88
    }
  ];

  const zapierIntegrations = [
    {
      name: "Google Sheets",
      description: "Synchroniser les contacts avec votre spreadsheet",
      status: "connected",
      icon: "📊"
    },
    {
      name: "Mailchimp",
      description: "Ajouter automatiquement à vos listes email", 
      status: "available",
      icon: "📧"
    },
    {
      name: "Notion",
      description: "Créer des pages client dans votre workspace",
      status: "available", 
      icon: "📝"
    },
    {
      name: "Airtable",
      description: "Gérer vos contacts dans une base structurée",
      status: "connected",
      icon: "🗃️"
    },
    {
      name: "Slack",
      description: "Notifications de nouveaux leads",
      status: "available",
      icon: "💬"
    },
    {
      name: "HubSpot",
      description: "Synchronisation CRM bidirectionnelle",
      status: "available",
      icon: "🎯"
    }
  ];

  const handleSendEmail = (contact: any) => {
    toast({
      title: "Email envoyé",
      description: `Message envoyé à ${contact.name}`,
    });
  };

  const handleZapierConnect = (integration: any) => {
    toast({
      title: `Connexion ${integration.name}`,
      description: "Configuration de l'intégration...",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "client": return "text-green-600 bg-green-100";
      case "prospect": return "text-blue-600 bg-blue-100"; 
      case "lead": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "client": return "Client";
      case "prospect": return "Prospect";
      case "lead": return "Lead";
      default: return "Inconnu";
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || contact.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            CRM & Zapier
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos contacts et automatisez vos workflows
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="hero">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Contact
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Leads</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23.4%</div>
            <p className="text-xs text-muted-foreground">Lead → Client</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Moyenne</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€342</div>
            <p className="text-xs text-muted-foreground">Par client</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side - Contacts List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="client">Clients</SelectItem>
                      <SelectItem value="prospect">Prospects</SelectItem>
                      <SelectItem value="lead">Leads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    Filtres Avancés
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts List */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Contacts ({filteredContacts.length})</CardTitle>
              <CardDescription>Gérez vos relations client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredContacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className={`p-4 border border-border rounded-lg cursor-pointer transition-all hover:shadow-card ${
                      selectedContact?.id === contact.id ? 'ring-2 ring-primary shadow-glow' : ''
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">{contact.email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            {contact.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <Badge className={getStatusColor(contact.status)}>
                          {getStatusText(contact.status)}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Score: {contact.score}/100
                        </div>
                        <div className="text-sm font-medium">
                          €{contact.totalSpent.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Contact Details & Zapier */}
        <div className="space-y-6">
          
          {/* Contact Details */}
          {selectedContact ? (
            <Card className="border-border bg-card shadow-glow">
              <CardHeader>
                <CardTitle>{selectedContact.name}</CardTitle>
                <CardDescription>Détails du contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContact.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContact.source}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-lg font-bold">{selectedContact.orders}</div>
                    <div className="text-xs text-muted-foreground">Commandes</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-lg font-bold">€{selectedContact.totalSpent}</div>
                    <div className="text-xs text-muted-foreground">Dépensé</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Note rapide</Label>
                  <Textarea 
                    placeholder="Ajouter une note..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="hero" 
                    className="flex-1"
                    onClick={() => handleSendEmail(selectedContact)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    SMS
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card shadow-card">
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sélectionnez un contact</h3>
                <p className="text-muted-foreground">
                  Cliquez sur un contact pour voir les détails
                </p>
              </CardContent>
            </Card>
          )}

          {/* Zapier Integrations */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Intégrations Zapier
              </CardTitle>
              <CardDescription>Automatisez vos workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zapierIntegrations.map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{integration.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{integration.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {integration.description}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant={integration.status === "connected" ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleZapierConnect(integration)}
                    >
                      {integration.status === "connected" ? "Configuré" : "Connecter"}
                    </Button>
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
                <Calendar className="mr-2 h-4 w-4" />
                Planifier suivi
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                Créer campagne
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Email en masse
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CRM;