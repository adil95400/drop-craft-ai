import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Wand2, 
  Target, 
  Mail, 
  MessageSquare, 
  Users,
  Calendar,
  Euro,
  TrendingUp,
  Sparkles,
  Bot,
  Zap,
  BarChart3,
  Send,
  Eye,
  Clock
} from 'lucide-react';
import { useMarketing } from '@/hooks/useMarketing';
import { useSyncStore } from '@/stores/syncStore';

interface CampaignData {
  name: string;
  description: string;
  type: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_audience: any;
  content: any;
  settings: any;
  budget_total?: number;
  scheduled_at?: string;
}

const MarketingCreate = () => {
  const navigate = useNavigate();
  const { createCampaign, isCreatingCampaign } = useMarketing();
  const syncStore = useSyncStore();
  
  const [step, setStep] = useState(1);
  const [isAIMode, setIsAIMode] = useState(true);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    type: 'email',
    status: 'draft',
    target_audience: {},
    content: {},
    settings: {}
  });

  const [aiSuggestions, setAiSuggestions] = useState({
    name: "Black Friday 2024 - Offres Exclusives",
    subject: "🔥 -70% sur TOUT | Dernières heures !",
    content: "Profitez de nos offres exceptionnelles Black Friday avec jusqu'à 70% de réduction sur tous nos produits. Stock limité, ne manquez pas cette opportunité unique !",
    audience: "Clients actifs derniers 6 mois",
    timing: "Vendredi 9h00 (heure optimale)",
    budget: 2500
  });

  const campaignTypes = [
    { value: 'email', label: 'Email Marketing', icon: Mail, description: 'Campagnes d\'emailing ciblées' },
    { value: 'social', label: 'Réseaux Sociaux', icon: MessageSquare, description: 'Publications et publicités sociales' },
    { value: 'ads', label: 'Publicités Payantes', icon: Target, description: 'Google Ads, Facebook Ads' },
    { value: 'retargeting', label: 'Retargeting', icon: Users, description: 'Visiteurs qui n\'ont pas converti' }
  ];

  const audienceSegments = [
    { id: 'all', name: 'Tous les contacts', count: '12,456', engagement: '4.2%' },
    { id: 'active', name: 'Clients actifs', count: '3,847', engagement: '8.9%' },
    { id: 'cart_abandon', name: 'Paniers abandonnés', count: '1,923', engagement: '12.4%' },
    { id: 'vip', name: 'Clients VIP', count: '567', engagement: '15.8%' },
    { id: 'inactive', name: 'Inactifs 3 mois', count: '2,145', engagement: '2.1%' }
  ];

  const handleAIGeneration = async () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setCampaignData({
            ...campaignData,
            name: aiSuggestions.name,
            description: aiSuggestions.content,
            content: {
              subject: aiSuggestions.subject,
              body: aiSuggestions.content
            },
            target_audience: {
              segment: 'active',
              timing: aiSuggestions.timing
            },
            budget_total: aiSuggestions.budget
          });
          setStep(2);
          resolve('success');
        }, 2000);
      }),
      {
        loading: 'IA génère votre campagne optimale...',
        success: 'Campagne générée avec succès !',
        error: 'Erreur lors de la génération'
      }
    );
  };

  const handleCreateCampaign = async () => {
    try {
      await createCampaign(campaignData);
      toast.success('Campagne créée avec succès !');
      navigate('/marketing');
    } catch (error) {
      toast.error('Erreur lors de la création de la campagne');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <React.Fragment key={stepNumber}>
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            ${step >= stepNumber 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground border-2 border-border'
            }
          `}>
            {stepNumber}
          </div>
          {stepNumber < 3 && (
            <div className={`w-16 h-1 mx-2 ${step > stepNumber ? 'bg-primary' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* AI Mode Toggle */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Création Assistée par IA</h3>
                <p className="text-sm text-muted-foreground">L'IA optimise votre campagne pour maximiser les conversions</p>
              </div>
            </div>
            <Switch 
              checked={isAIMode} 
              onCheckedChange={setIsAIMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaign Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Type de Campagne</CardTitle>
          <CardDescription>Choisissez le type de campagne qui correspond à vos objectifs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignTypes.map((type) => (
              <div
                key={type.value}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50
                  ${campaignData.type === type.value 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border'
                  }
                `}
                onClick={() => setCampaignData({ ...campaignData, type: type.value })}
              >
                <div className="flex items-start gap-3">
                  <type.icon className={`h-5 w-5 mt-1 ${campaignData.type === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <h4 className="font-medium">{type.label}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions Preview */}
      {isAIMode && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Suggestions IA</CardTitle>
            </div>
            <CardDescription>Basées sur vos meilleures performances passées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Nom suggéré</Label>
                <p className="font-medium">{aiSuggestions.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Budget optimal</Label>
                <p className="font-medium">{aiSuggestions.budget}€</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Audience cible</Label>
                <p className="font-medium">{aiSuggestions.audience}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Timing optimal</Label>
                <p className="font-medium">{aiSuggestions.timing}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Message suggéré</Label>
              <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">{aiSuggestions.content}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/marketing')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button onClick={isAIMode ? handleAIGeneration : () => setStep(2)}>
          {isAIMode ? (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Générer avec IA
            </>
          ) : (
            <>
              Continuer
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contenu de la Campagne</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Nom de la campagne</Label>
                <Input
                  id="campaign-name"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  placeholder="Ex: Black Friday 2024"
                />
              </div>
              
              {campaignData.type === 'email' && (
                <div>
                  <Label htmlFor="subject">Objet de l'email</Label>
                  <Input
                    id="subject"
                    value={campaignData.content?.subject || ''}
                    onChange={(e) => setCampaignData({ 
                      ...campaignData, 
                      content: { ...campaignData.content, subject: e.target.value }
                    })}
                    placeholder="Objet accrocheur"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Description / Message</Label>
                <Textarea
                  id="description"
                  value={campaignData.description}
                  onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                  placeholder="Contenu de votre campagne..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sélection d'Audience</CardTitle>
              <CardDescription>Choisissez le segment de clients à cibler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {audienceSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${campaignData.target_audience?.segment === segment.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                      }
                    `}
                    onClick={() => setCampaignData({
                      ...campaignData,
                      target_audience: { ...campaignData.target_audience, segment: segment.id }
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{segment.name}</h4>
                        <p className="text-sm text-muted-foreground">{segment.count} contacts</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{segment.engagement}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">engagement</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget & Planification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="budget">Budget total (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={campaignData.budget_total || ''}
                    onChange={(e) => setCampaignData({ ...campaignData, budget_total: Number(e.target.value) })}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="schedule">Planifier l'envoi</Label>
                  <Input
                    id="schedule"
                    type="datetime-local"
                    value={campaignData.scheduled_at || ''}
                    onChange={(e) => setCampaignData({ ...campaignData, scheduled_at: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Options Avancées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Test A/B automatique</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Optimisation IA</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Rapports détaillés</Label>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>
        <Button onClick={() => setStep(3)}>
          Suivant
          <TrendingUp className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu de la Campagne
          </CardTitle>
          <CardDescription>Vérifiez tous les détails avant de lancer votre campagne</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">INFORMATIONS GÉNÉRALES</h4>
              <div>
                <p className="font-semibold">{campaignData.name}</p>
                <p className="text-sm text-muted-foreground">{campaignData.type}</p>
              </div>
              <div>
                <p className="text-sm">Budget: <span className="font-medium">{campaignData.budget_total}€</span></p>
                <p className="text-sm">Audience: <span className="font-medium">{audienceSegments.find(s => s.id === campaignData.target_audience?.segment)?.name}</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">PRÉDICTIONS IA</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Taux d'ouverture prévu</span>
                  <span className="font-medium text-green-600">24.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversions estimées</span>
                  <span className="font-medium text-blue-600">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">ROI prévu</span>
                  <span className="font-medium text-purple-600">+240%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">OPTIMISATIONS</h4>
              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-center">
                  <Zap className="h-3 w-3 mr-1" />
                  Timing optimisé
                </Badge>
                <Badge variant="secondary" className="w-full justify-center">
                  <Target className="h-3 w-3 mr-1" />
                  Audience ciblée
                </Badge>
                <Badge variant="secondary" className="w-full justify-center">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  A/B Test activé
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Content Preview */}
          {campaignData.type === 'email' && (
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium mb-3">Aperçu Email</h4>
              <div className="bg-white border border-border rounded p-4 space-y-2">
                <div className="text-sm font-medium">Objet: {campaignData.content?.subject}</div>
                <Separator />
                <div className="text-sm whitespace-pre-wrap">{campaignData.description}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Modifier
        </Button>
        <Button 
          onClick={handleCreateCampaign} 
          disabled={isCreatingCampaign}
          className="min-w-[140px]"
        >
          {isCreatingCampaign ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Création...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Lancer la Campagne
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Créer une Campagne Marketing
        </h1>
        <p className="text-muted-foreground mt-2">
          Créez des campagnes intelligentes optimisées par IA pour maximiser vos conversions
        </p>
      </div>

      {/* Progress Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <Card className="border-border bg-card shadow-card">
        <CardContent className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingCreate;