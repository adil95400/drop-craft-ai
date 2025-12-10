import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Workflow, 
  Play, 
  Pause,
  Plus,
  Mail,
  MessageSquare,
  Clock,
  ArrowRight,
  Users,
  Target,
  Zap,
  BarChart3,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface NurturingStep {
  id: string;
  type: 'email' | 'sms' | 'wait' | 'condition' | 'action';
  name: string;
  config: Record<string, any>;
  stats?: {
    sent?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
  };
}

interface NurturingCampaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  trigger: string;
  steps: NurturingStep[];
  enrolledContacts: number;
  completedContacts: number;
  conversionRate: number;
  createdAt: string;
}

export const LeadNurturing: React.FC = () => {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Mock campaigns
  const [campaigns, setCampaigns] = useState<NurturingCampaign[]>([
    {
      id: '1',
      name: 'Bienvenue nouveaux clients',
      description: 'Séquence d\'onboarding pour les nouveaux inscrits',
      status: 'active',
      trigger: 'Inscription newsletter',
      enrolledContacts: 1250,
      completedContacts: 890,
      conversionRate: 23.5,
      createdAt: '2024-01-01',
      steps: [
        { id: 's1', type: 'email', name: 'Email de bienvenue', config: { template: 'welcome' }, stats: { sent: 1250, opened: 875, clicked: 450 } },
        { id: 's2', type: 'wait', name: 'Attendre 2 jours', config: { days: 2 } },
        { id: 's3', type: 'email', name: 'Présentation produits', config: { template: 'products' }, stats: { sent: 1100, opened: 660, clicked: 275 } },
        { id: 's4', type: 'condition', name: 'A cliqué ?', config: { condition: 'clicked_email' } },
        { id: 's5', type: 'email', name: 'Offre spéciale', config: { template: 'offer' }, stats: { sent: 275, opened: 192, clicked: 85 } }
      ]
    },
    {
      id: '2',
      name: 'Récupération panier abandonné',
      description: 'Relance automatique après abandon de panier',
      status: 'active',
      trigger: 'Abandon panier',
      enrolledContacts: 456,
      completedContacts: 234,
      conversionRate: 18.2,
      createdAt: '2024-01-10',
      steps: [
        { id: 's1', type: 'wait', name: 'Attendre 1 heure', config: { hours: 1 } },
        { id: 's2', type: 'email', name: 'Rappel panier', config: { template: 'cart_reminder' }, stats: { sent: 456, opened: 342, clicked: 156 } },
        { id: 's3', type: 'wait', name: 'Attendre 24 heures', config: { hours: 24 } },
        { id: 's4', type: 'condition', name: 'A acheté ?', config: { condition: 'purchased' } },
        { id: 's5', type: 'email', name: 'Offre -10%', config: { template: 'discount' }, stats: { sent: 300, opened: 210, clicked: 83 } }
      ]
    },
    {
      id: '3',
      name: 'Réactivation clients inactifs',
      description: 'Campagne pour réengager les clients dormants',
      status: 'paused',
      trigger: 'Inactif depuis 60 jours',
      enrolledContacts: 890,
      completedContacts: 0,
      conversionRate: 0,
      createdAt: '2024-01-15',
      steps: [
        { id: 's1', type: 'email', name: 'Vous nous manquez', config: { template: 'miss_you' } },
        { id: 's2', type: 'wait', name: 'Attendre 5 jours', config: { days: 5 } },
        { id: 's3', type: 'sms', name: 'SMS promo exclusive', config: { template: 'sms_promo' } }
      ]
    }
  ]);

  const getStatusBadge = (status: NurturingCampaign['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">En pause</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Brouillon</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Terminée</Badge>;
    }
  };

  const getStepIcon = (type: NurturingStep['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'wait': return <Clock className="h-4 w-4" />;
      case 'condition': return <Target className="h-4 w-4" />;
      case 'action': return <Zap className="h-4 w-4" />;
    }
  };

  const toggleCampaignStatus = (campaignId: string) => {
    setCampaigns(campaigns.map(campaign => {
      if (campaign.id === campaignId) {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        toast({
          title: newStatus === 'active' ? 'Campagne activée' : 'Campagne mise en pause',
          description: `La campagne "${campaign.name}" est maintenant ${newStatus === 'active' ? 'active' : 'en pause'}.`
        });
        return { ...campaign, status: newStatus };
      }
      return campaign;
    }));
  };

  const duplicateCampaign = (campaign: NurturingCampaign) => {
    const newCampaign: NurturingCampaign = {
      ...campaign,
      id: Date.now().toString(),
      name: `${campaign.name} (copie)`,
      status: 'draft',
      enrolledContacts: 0,
      completedContacts: 0,
      conversionRate: 0,
      createdAt: new Date().toISOString()
    };
    setCampaigns([...campaigns, newCampaign]);
    toast({ title: 'Campagne dupliquée', description: 'La campagne a été copiée en mode brouillon.' });
  };

  const deleteCampaign = (campaignId: string) => {
    setCampaigns(campaigns.filter(c => c.id !== campaignId));
    toast({ title: 'Campagne supprimée' });
  };

  const activeCampaign = campaigns.find(c => c.id === selectedCampaign);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campagnes actives</p>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</p>
              </div>
              <Play className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacts en nurturing</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + c.enrolledContacts - c.completedContacts, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de conversion moy.</p>
                <p className="text-2xl font-bold">
                  {(campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emails envoyés</p>
                <p className="text-2xl font-bold">12.5K</p>
              </div>
              <Mail className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Campaigns List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-primary" />
                  Campagnes de nurturing
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle campagne
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCampaign === campaign.id ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {campaign.trigger}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.enrolledContacts.toLocaleString()} inscrits
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {campaign.conversionRate}% conversion
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCampaignStatus(campaign.id);
                        }}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateCampaign(campaign)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Statistiques
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteCampaign(campaign.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progression</span>
                      <span>{Math.round((campaign.completedContacts / campaign.enrolledContacts) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(campaign.completedContacts / campaign.enrolledContacts) * 100} 
                      className="h-1.5"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details / Workflow */}
        <div>
          {activeCampaign ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeCampaign.steps.map((step, index) => (
                    <div key={step.id}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          step.type === 'email' ? 'bg-blue-500/10 text-blue-500' :
                          step.type === 'sms' ? 'bg-green-500/10 text-green-500' :
                          step.type === 'wait' ? 'bg-yellow-500/10 text-yellow-500' :
                          step.type === 'condition' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {getStepIcon(step.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.name}</p>
                          {step.stats && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {step.stats.sent && <span>{step.stats.sent} envoyés</span>}
                              {step.stats.opened && (
                                <span className="text-green-500">
                                  {Math.round((step.stats.opened / step.stats.sent!) * 100)}% ouvert
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < activeCampaign.steps.length - 1 && (
                        <div className="ml-4 my-2 border-l-2 border-dashed border-muted-foreground/30 h-4" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Modifier le workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  <Workflow className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Sélectionnez une campagne pour voir le workflow</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Templates */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Templates rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Séquence de bienvenue
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Récupération panier
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Réactivation client
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Upsell/Cross-sell
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
