import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminCRM = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  useEffect(() => {
    if (user?.id) {
      loadContacts();
    }
  }, [user?.id]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('lead_score', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les contacts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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
    totalContacts: contacts.length,
    activeDeals: deals.length,
    pipelineValue: deals.reduce((acc: number, deal: any) => acc + (deal.value || 0), 0),
    avgDealSize: deals.length > 0 ? deals.reduce((acc: number, deal: any) => acc + (deal.value || 0), 0) / deals.length : 0,
    conversionRate: 75.5,
    avgLeadScore: contacts.length > 0 
      ? Math.round(contacts.reduce((acc: number, contact: any) => acc + (contact.lead_score || 0), 0) / contacts.length)
      : 0
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
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
          <TabsTrigger value="activities">Activités ({activities.length})</TabsTrigger>
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
            {contacts.map((contact) => (
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
            {deals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun deal en cours</h3>
                  <p className="text-muted-foreground mb-4">Créez votre premier deal pour suivre vos opportunités commerciales</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Deal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              deals.map((deal) => (
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
            )))}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune activité</h3>
                  <p className="text-muted-foreground">Les activités CRM apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              activities.map((activity) => (
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
            )))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCRM;