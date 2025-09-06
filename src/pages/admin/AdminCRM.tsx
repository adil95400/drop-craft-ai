import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, Mail, Phone, Calendar, TrendingUp, Users, DollarSign, Target, MessageCircle, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

// Mock data pour CRM
const mockContacts = [
  {
    id: '1',
    userId: 'user-1',
    name: 'Sophie Durand',
    email: 'sophie.durand@email.com',
    phone: '+33 6 12 34 56 78',
    company: 'TechCorp',
    position: 'Responsable Achats',
    leadScore: 85,
    status: 'qualified',
    source: 'website',
    lastContact: '2024-01-15',
    nextAction: '2024-01-20',
    dealValue: 15000,
    stage: 'negotiation',
    tags: ['vip', 'decision-maker']
  },
  {
    id: '2',
    userId: 'user-2',
    name: 'Marc Martin',
    email: 'marc.martin@startup.fr',
    phone: '+33 6 98 76 54 32',
    company: 'StartupInnovante',
    position: 'CEO', 
    leadScore: 72,
    status: 'interested',
    source: 'linkedin',
    lastContact: '2024-01-12',
    nextAction: '2024-01-18',
    dealValue: 8500,
    stage: 'proposal',
    tags: ['startup', 'tech']
  },
  {
    id: '3',
    userId: 'user-1',
    name: 'Claire Leroy',
    email: 'claire.leroy@bigcorp.com',
    phone: '+33 6 55 44 33 22',
    company: 'BigCorp Industries',
    position: 'Directrice Marketing',
    leadScore: 94,
    status: 'hot',
    source: 'referral',
    lastContact: '2024-01-14',
    nextAction: '2024-01-16',
    dealValue: 45000,
    stage: 'closing',
    tags: ['enterprise', 'urgent']
  }
];

// Mock data pour les deals
const mockDeals = [
  {
    id: '1',
    contactId: '1',
    contactName: 'Sophie Durand',
    company: 'TechCorp',
    value: 15000,
    stage: 'negotiation',
    probability: 70,
    closeDate: '2024-02-15',
    createdDate: '2024-01-05',
    lastActivity: '2024-01-15',
    notes: 'Intéressée par le plan ultra pro, négociation en cours sur le prix'
  },
  {
    id: '2',
    contactId: '3',
    contactName: 'Claire Leroy',
    company: 'BigCorp Industries',
    value: 45000,
    stage: 'closing',
    probability: 90,
    closeDate: '2024-01-25',
    createdDate: '2023-12-10',
    lastActivity: '2024-01-14',
    notes: 'Contrat en relecture juridique, signature prévue la semaine prochaine'
  }
];

// Mock data pour les activités
const mockActivities = [
  {
    id: '1',
    contactId: '1',
    type: 'email',
    subject: 'Proposition commerciale envoyée',
    date: '2024-01-15T14:30:00Z',
    status: 'completed',
    notes: 'Envoi de la proposition détaillée avec tarifs négociés'
  },
  {
    id: '2',
    contactId: '3',
    type: 'call',
    subject: 'Appel de suivi - négociation contrat',
    date: '2024-01-14T10:00:00Z',
    status: 'completed',
    notes: 'Discussion sur les modalités de paiement et délais de mise en œuvre'
  },
  {
    id: '3',
    contactId: '2',
    type: 'meeting',
    subject: 'Rendez-vous démo produit',
    date: '2024-01-18T15:00:00Z',
    status: 'scheduled',
    notes: 'Démonstration des fonctionnalités avancées'
  }
];

const AdminCRM = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'interested': return 'bg-blue-100 text-blue-800';
      case 'cold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch(stage) {
      case 'lead': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closing': return 'bg-green-100 text-green-800';
      case 'won': return 'bg-emerald-100 text-emerald-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'task': return <Target className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const crmStats = {
    totalContacts: mockContacts.length,
    activeDeals: mockDeals.length,
    pipelineValue: mockDeals.reduce((acc, deal) => acc + deal.value, 0),
    avgDealSize: mockDeals.reduce((acc, deal) => acc + deal.value, 0) / mockDeals.length,
    conversionRate: 75.5,
    avgLeadScore: Math.round(mockContacts.reduce((acc, contact) => acc + contact.leadScore, 0) / mockContacts.length)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion CRM</h1>
          <p className="text-muted-foreground">Gestion des contacts, prospects et pipeline commercial</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contactName">Nom complet</Label>
                  <Input id="contactName" placeholder="John Doe" />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input id="contactEmail" type="email" placeholder="john@company.com" />
                </div>
                <div>
                  <Label htmlFor="contactCompany">Entreprise</Label>
                  <Input id="contactCompany" placeholder="Company Inc." />
                </div>
                <div>
                  <Label htmlFor="contactPosition">Poste</Label>
                  <Input id="contactPosition" placeholder="CEO" />
                </div>
                <Button className="w-full">Ajouter le Contact</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">+5 ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Actifs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.activeDeals}</div>
            <p className="text-xs text-muted-foreground">+2 cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.pipelineValue.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deal Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(crmStats.avgDealSize).toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">+8% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">+2% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.avgLeadScore}</div>
            <p className="text-xs text-muted-foreground">+3 points</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts">Contacts ({mockContacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({mockDeals.length})</TabsTrigger>
          <TabsTrigger value="activities">Activités ({mockActivities.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="hot">Chaud</SelectItem>
                    <SelectItem value="qualified">Qualifié</SelectItem>
                    <SelectItem value="interested">Intéressé</SelectItem>
                    <SelectItem value="cold">Froid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contacts List */}
          <div className="space-y-4">
            {mockContacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">{contact.position} - {contact.company}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="w-3 h-3" />
                          <span className="text-xs text-muted-foreground">{contact.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{contact.leadScore}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">{contact.dealValue.toLocaleString()}€</p>
                        <p className="text-xs text-muted-foreground">Valeur</p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                        <Badge className={getStageColor(contact.stage)}>
                          {contact.stage}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Prochaine action</p>
                        <p className="text-xs text-muted-foreground">{contact.nextAction}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <div className="space-y-4">
            {mockDeals.map((deal) => (
              <Card key={deal.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{deal.contactName}</h3>
                        <p className="text-sm text-muted-foreground">{deal.company}</p>
                        <p className="text-xs text-muted-foreground mt-1">Créé le {deal.createdDate}</p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{deal.value.toLocaleString()}€</p>
                          <p className="text-xs text-muted-foreground">Valeur</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">{deal.probability}%</p>
                          <p className="text-xs text-muted-foreground">Probabilité</p>
                        </div>
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progression</span>
                        <span>{deal.probability}%</span>
                      </div>
                      <Progress value={deal.probability} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Clôture prévue: </span>
                        <span className="font-medium">{deal.closeDate}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {deal.notes && (
                      <div className="bg-muted/30 p-3 rounded">
                        <p className="text-sm">{deal.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{activity.subject}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.date).toLocaleString('fr-FR')}
                          </p>
                          {activity.notes && (
                            <p className="text-sm mt-2">{activity.notes}</p>
                          )}
                        </div>
                        <Badge 
                          className={activity.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCRM;