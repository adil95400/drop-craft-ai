import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Target,
  TrendingUp,
  Star,
  Clock,
  Activity,
  Send,
  Filter,
  Search,
  Plus,
  Eye,
  Edit3,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { logError } from '@/utils/consoleCleanup';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status: 'active' | 'inactive' | 'prospect' | 'customer';
  lifecycle_stage: 'subscriber' | 'lead' | 'opportunity' | 'customer' | 'evangelist';
  lead_score: number;
  last_activity_at?: string;
  created_at: string;
  tags: string[];
  custom_fields: Record<string, any>;
}

interface CRMActivity {
  id: string;
  contact_id: string;
  activity_type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
  contact?: { name: string };
}

interface CRMMetrics {
  total_contacts: number;
  active_leads: number;
  conversion_rate: number;
  avg_lead_score: number;
  activities_this_week: number;
  pipeline_value: number;
}

export const CRMDashboard: React.FC = () => {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const { toast } = useToast();

  const conversionFunnelData = [
    { stage: 'Visiteurs', count: 2450, color: '#E5E7EB' },
    { stage: 'Prospects', count: 485, color: '#93C5FD' },
    { stage: 'Leads Qualifiés', count: 125, color: '#60A5FA' },
    { stage: 'Opportunités', count: 68, color: '#3B82F6' },
    { stage: 'Clients', count: 23, color: '#1D4ED8' }
  ];

  const leadScoreDistribution = [
    { range: '0-20', count: 45, color: '#EF4444' },
    { range: '21-40', count: 78, color: '#F97316' },
    { range: '41-60', count: 156, color: '#EAB308' },
    { range: '61-80', count: 89, color: '#22C55E' },
    { range: '81-100', count: 34, color: '#10B981' }
  ];

  const activityTrends = [
    { date: '2024-01-01', emails: 45, calls: 12, meetings: 8, notes: 23 },
    { date: '2024-01-02', emails: 52, calls: 15, meetings: 6, notes: 31 },
    { date: '2024-01-03', emails: 38, calls: 9, meetings: 12, notes: 18 },
    { date: '2024-01-04', emails: 61, calls: 18, meetings: 9, notes: 28 },
    { date: '2024-01-05', emails: 49, calls: 14, meetings: 11, notes: 25 },
    { date: '2024-01-06', emails: 55, calls: 16, meetings: 7, notes: 33 },
    { date: '2024-01-07', emails: 43, calls: 11, meetings: 14, notes: 19 }
  ];

  useEffect(() => {
    fetchCRMData();
  }, []);

  const fetchCRMData = async () => {
    try {
      setLoading(true);

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactsData) {
        const transformedContacts = contactsData.map(contact => ({
          ...contact,
          status: (contact.status || 'active') as 'active' | 'inactive' | 'prospect' | 'customer',
          lifecycle_stage: (contact.lifecycle_stage || 'subscriber') as 'subscriber' | 'lead' | 'opportunity' | 'customer' | 'evangelist',
          lead_score: contact.lead_score || 0,
          tags: contact.tags || [],
          custom_fields: (contact.custom_fields as Record<string, any>) || {}
        }));
        setContacts(transformedContacts);
      }

      // Simulate activities (en attendant la vraie table)
      const mockActivities: CRMActivity[] = contactsData?.slice(0, 10).map((contact, index) => ({
        id: `activity-${index}`,
        contact_id: contact.id,
        activity_type: ['email', 'call', 'meeting', 'note'][Math.floor(Math.random() * 4)] as any,
        title: `Activité avec ${contact.name}`,
        description: 'Suivi commercial important',
        completed: Math.random() > 0.5,
        due_date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        contact: { name: contact.name }
      })) || [];

      setActivities(mockActivities);

      // Calculate metrics
      const totalContacts = contactsData?.length || 0;
      const activeLeads = contactsData?.filter(c => c.lifecycle_stage === 'lead').length || 0;
      const customers = contactsData?.filter(c => c.lifecycle_stage === 'customer').length || 0;
      const conversionRate = totalContacts > 0 ? (customers / totalContacts) * 100 : 0;
      const avgLeadScore = contactsData?.reduce((sum, c) => sum + (c.lead_score || 0), 0) / (totalContacts || 1) || 0;

      setMetrics({
        total_contacts: totalContacts,
        active_leads: activeLeads,
        conversion_rate: conversionRate,
        avg_lead_score: avgLeadScore,
        activities_this_week: mockActivities.length,
        pipeline_value: activeLeads * 1250 // Valeur moyenne par lead
      });

    } catch (error) {
      logError(error as Error, 'Error fetching CRM data');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données CRM",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'prospect': 'bg-blue-100 text-blue-800',
      'customer': 'bg-purple-100 text-purple-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getLifecycleColor = (stage: string) => {
    const colors = {
      'subscriber': 'bg-gray-100 text-gray-800',
      'lead': 'bg-yellow-100 text-yellow-800',
      'opportunity': 'bg-orange-100 text-orange-800',
      'customer': 'bg-green-100 text-green-800',
      'evangelist': 'bg-purple-100 text-purple-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      'email': Mail,
      'call': Phone,
      'meeting': Calendar,
      'note': MessageSquare
    };
    return icons[type as keyof typeof icons] || MessageSquare;
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM Dashboard</h1>
          <p className="text-muted-foreground">Gestion complète de vos relations clients</p>
        </div>
        <Button onClick={() => setShowAddContact(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nouveau Contact
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{metrics?.total_contacts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads Actifs</p>
                <p className="text-2xl font-bold">{metrics?.active_leads || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de Conversion</p>
                <p className="text-2xl font-bold">{metrics?.conversion_rate?.toFixed(1) || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valeur Pipeline</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.pipeline_value || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entonnoir de Conversion</CardTitle>
            <CardDescription>Progression des prospects dans le pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip formatter={(value) => [`${value} contacts`, 'Nombre']} />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activités Cette Semaine</CardTitle>
            <CardDescription>Répartition des activités par type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' })} />
                <YAxis />
                <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')} />
                <Line type="monotone" dataKey="emails" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="calls" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="meetings" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="notes" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="activities">Activités</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Contacts</CardTitle>
              <CardDescription>Liste complète de vos contacts CRM</CardDescription>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Client</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-medium text-primary">{contact.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contact.name}</p>
                          <Badge className={getStatusColor(contact.status)} variant="outline">
                            {contact.status}
                          </Badge>
                          <Badge className={getLifecycleColor(contact.lifecycle_stage)} variant="outline">
                            {contact.lifecycle_stage}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        {contact.company && (
                          <p className="text-xs text-muted-foreground">{contact.company} • {contact.position}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">Score: {contact.lead_score}/100</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">
                            {contact.lead_score >= 80 ? 'Excellent' : 
                             contact.lead_score >= 60 ? 'Bon' : 
                             contact.lead_score >= 40 ? 'Moyen' : 'Faible'}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedContact(contact)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activités Récentes</CardTitle>
              <CardDescription>Historique des interactions avec vos contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.activity_type);
                  return (
                    <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.activity_type === 'email' ? 'bg-blue-100' :
                        activity.activity_type === 'call' ? 'bg-green-100' :
                        activity.activity_type === 'meeting' ? 'bg-purple-100' : 'bg-orange-100'
                      }`}>
                        <ActivityIcon className={`w-5 h-5 ${
                          activity.activity_type === 'email' ? 'text-blue-600' :
                          activity.activity_type === 'call' ? 'text-green-600' :
                          activity.activity_type === 'meeting' ? 'text-purple-600' : 'text-orange-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{activity.title}</p>
                          {activity.completed ? (
                            <Badge className="bg-green-100 text-green-800" variant="outline">Terminé</Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800" variant="outline">En cours</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Contact: {activity.contact?.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Scores</CardTitle>
                <CardDescription>Répartition des contacts par score de lead</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={leadScoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, count }: any) => `${range}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {leadScoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Mensuelle</CardTitle>
                <CardDescription>Évolution des métriques clés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Score Lead Moyen</span>
                    <span className="text-lg font-bold">{metrics?.avg_lead_score?.toFixed(1) || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Activités Cette Semaine</span>
                    <span className="text-lg font-bold">{metrics?.activities_this_week || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Valeur Moyenne/Lead</span>
                    <span className="text-lg font-bold">€1,250</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Temps de Conversion</span>
                    <span className="text-lg font-bold">14 jours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};