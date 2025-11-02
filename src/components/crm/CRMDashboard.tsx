import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Target,
  TrendingUp,
  Star,
  MessageSquare,
  Search,
  Eye,
  Calendar
} from 'lucide-react';
import { LineChart, Line, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useRealCRMDashboard } from '@/hooks/useRealCRMDashboard';

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
  const { customers, metrics, segments, isLoading } = useRealCRMDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  const segmentChartData = segments.map(seg => ({
    stage: seg.name,
    count: seg.count,
    color: seg.color.replace('bg-', '#')
  }));

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'prospect': 'bg-blue-100 text-blue-800',
      'customer': 'bg-purple-100 text-purple-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSegmentColor = (segment: string) => {
    const colors = {
      'vip': 'bg-purple-100 text-purple-800',
      'loyal': 'bg-blue-100 text-blue-800',
      'new': 'bg-green-100 text-green-800',
      'at_risk': 'bg-orange-100 text-orange-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[segment as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  const filteredContacts = customers.filter(contact => {
    const matchesSearch = contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (isLoading) {
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
        <Button>
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
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{metrics?.total_customers || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Clients VIP</p>
                <p className="text-2xl font-bold">{metrics?.vip_customers || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Taux de Fidélité</p>
                <p className="text-2xl font-bold">{(100 - (metrics?.churn_rate || 0)).toFixed(1)}%</p>
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
                <p className="text-sm font-medium text-muted-foreground">Valeur Moyenne</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.avg_lifetime_value || 0)}</p>
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
            <CardTitle>Segments Clients</CardTitle>
            <CardDescription>Distribution par segment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={120} />
                <Tooltip formatter={(value) => [`${value} clients`, 'Nombre']} />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segments Clients</CardTitle>
            <CardDescription>Distribution par segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {segments.map((segment, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${segment.color}`} />
                    <span className="text-sm">{segment.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{segment.count} clients</span>
                    <span className="text-sm text-muted-foreground">{segment.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
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
                        <span className="font-medium text-primary">{contact.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contact.full_name}</p>
                          <Badge className={getStatusColor(contact.status)} variant="outline">
                            {contact.status}
                          </Badge>
                          <Badge className={getSegmentColor(contact.segment)} variant="outline">
                            {contact.segment}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        {contact.phone && (
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(contact.lifetime_value)}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">
                            {contact.total_orders} commandes
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
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

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nouveaux ce mois</p>
                  <p className="text-2xl font-bold">{metrics?.new_this_month || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valeur moyenne</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics?.avg_customer_value || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};