import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  LayoutTemplate
} from 'lucide-react';
import { useCustomerSegments, useRFMScores, useSegmentStats, useCreateCustomerSegment, useDeleteCustomerSegment, useCalculateRFMScores } from '@/hooks/useCustomerSegmentation';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { SegmentTemplatesModal } from './SegmentTemplatesModal';
import { SegmentTemplate } from '@/services/CustomerSegmentationService';
import { ReportingTab } from './ReportingTab';
import { toast } from 'sonner';

export function CustomerSegmentationDashboard() {
  const locale = useDateFnsLocale();
  const [activeTab, setActiveTab] = useState('segments');
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const { data: segments = [] } = useCustomerSegments();
  const { data: rfmScores = [] } = useRFMScores();
  const { data: stats } = useSegmentStats();
  const createSegment = useCreateCustomerSegment();
  const deleteSegment = useDeleteCustomerSegment();
  const calculateRFM = useCalculateRFMScores();

  const handleCreate = () => {
    createSegment.mutate({ 
      name: 'Nouveau segment',
      segment_type: 'dynamic'
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce segment ?')) {
      deleteSegment.mutate(id);
    }
  };

  const handleTemplateSelect = async (template: SegmentTemplate) => {
    try {
      await createSegment.mutateAsync({
        name: template.name,
        description: template.description,
        segment_type: 'dynamic',
        rules: template.rules,
        is_active: true
      });
      toast.success(`Segment "${template.name}" créé avec succès`);
    } catch (error) {
      console.error('Error creating segment from template:', error);
      toast.error('Erreur lors de la création du segment');
    }
  };

  const getRFMColor = (score: number) => {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-yellow-500';
    if (score >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSegmentTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      dynamic: 'default',
      static: 'secondary',
      ai_generated: 'outline'
    };
    const labels: Record<string, string> = {
      dynamic: 'Dynamique',
      static: 'Statique',
      ai_generated: 'IA'
    };
    return <Badge variant={variants[type] || 'secondary'}>{labels[type] || type}</Badge>;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total segments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSegments || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients segmentés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomersSegmented || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taille moyenne</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgSegmentSize || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Champions RFM</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rfmDistribution?.['Champions'] || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* RFM Distribution */}
      {stats?.rfmDistribution && Object.keys(stats.rfmDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution RFM</CardTitle>
            <CardDescription>Répartition des clients par segment RFM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.rfmDistribution).map(([segment, count]) => (
                <div key={segment} className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{segment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="rfm">Analyse RFM</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Modèles
            </Button>
            <Button variant="outline" onClick={() => calculateRFM.mutate()} disabled={calculateRFM.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${calculateRFM.isPending ? 'animate-spin' : ''}`} />
              Recalculer RFM
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau segment
            </Button>
          </div>
        </div>

        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>Segments clients</CardTitle>
              <CardDescription>Gérez vos segments pour cibler vos campagnes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Panier moyen</TableHead>
                    <TableHead>CA Total</TableHead>
                    <TableHead>Mise à jour</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell className="font-medium">{segment.name}</TableCell>
                      <TableCell>{getSegmentTypeBadge(segment.segment_type)}</TableCell>
                      <TableCell>{segment.customer_count}</TableCell>
                      <TableCell>{formatCurrency(segment.avg_order_value)}</TableCell>
                      <TableCell>{formatCurrency(segment.total_revenue)}</TableCell>
                      <TableCell>
                        {segment.last_calculated_at 
                          ? formatDistanceToNow(new Date(segment.last_calculated_at), { addSuffix: true, locale })
                          : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(segment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {segments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Aucun segment créé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rfm">
          <Card>
            <CardHeader>
              <CardTitle>Scores RFM des clients</CardTitle>
              <CardDescription>Récence, Fréquence, Montant</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>R</TableHead>
                    <TableHead>F</TableHead>
                    <TableHead>M</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>CA Total</TableHead>
                    <TableHead>Dernière commande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfmScores.slice(0, 20).map((rfm) => (
                    <TableRow key={rfm.id}>
                      <TableCell className="font-medium">
                        {rfm.customer 
                          ? `${rfm.customer.first_name || ''} ${rfm.customer.last_name || ''}`.trim() || 'Sans nom'
                          : 'Client inconnu'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rfm.customer?.email || '-'}
                      </TableCell>
                      <TableCell>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${getRFMColor(rfm.recency_score)}`}>
                          {rfm.recency_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${getRFMColor(rfm.frequency_score)}`}>
                          {rfm.frequency_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${getRFMColor(rfm.monetary_score)}`}>
                          {rfm.monetary_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rfm.rfm_segment}</Badge>
                      </TableCell>
                      <TableCell>{rfm.total_orders}</TableCell>
                      <TableCell>{formatCurrency(rfm.total_spent)}</TableCell>
                      <TableCell>
                        {rfm.days_since_last_order !== undefined 
                          ? `Il y a ${rfm.days_since_last_order} jours`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rfmScores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Aucun score RFM calculé. Cliquez sur "Recalculer RFM" pour démarrer.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting">
          <ReportingTab />
        </TabsContent>
      </Tabs>

      <SegmentTemplatesModal
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
}
