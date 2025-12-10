import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail, MessageSquare, Bell, Plus, Play, Pause, Trash2, Clock, ArrowRight, Users, GitBranch, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface SequenceStep {
  id: string;
  type: 'email' | 'sms' | 'push' | 'wait' | 'condition';
  templateId?: string;
  templateName?: string;
  delay?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
  condition?: {
    type: 'opened' | 'clicked' | 'converted' | 'not_opened';
    value?: string;
  };
}

interface Sequence {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  steps: SequenceStep[];
  enrolledCount: number;
  completedCount: number;
  conversionRate: number;
  createdAt: string;
}

const mockSequences: Sequence[] = [
  {
    id: '1',
    name: 'Onboarding Nouveau Client',
    description: 'Séquence de bienvenue multi-canal sur 7 jours',
    trigger: 'Inscription',
    status: 'active',
    steps: [
      { id: 's1', type: 'email', templateName: 'Email de bienvenue' },
      { id: 's2', type: 'wait', delay: 1, delayUnit: 'days' },
      { id: 's3', type: 'sms', templateName: 'SMS code promo' },
      { id: 's4', type: 'wait', delay: 3, delayUnit: 'days' },
      { id: 's5', type: 'condition', condition: { type: 'not_opened' } },
      { id: 's6', type: 'push', templateName: 'Rappel Push' }
    ],
    enrolledCount: 2450,
    completedCount: 1890,
    conversionRate: 34.5,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Récupération Panier Abandonné',
    description: 'Séquence de relance panier sur 48h',
    trigger: 'Panier abandonné',
    status: 'active',
    steps: [
      { id: 's1', type: 'wait', delay: 30, delayUnit: 'minutes' },
      { id: 's2', type: 'email', templateName: 'Rappel panier' },
      { id: 's3', type: 'wait', delay: 4, delayUnit: 'hours' },
      { id: 's4', type: 'condition', condition: { type: 'not_opened' } },
      { id: 's5', type: 'sms', templateName: 'SMS urgence panier' },
      { id: 's6', type: 'wait', delay: 24, delayUnit: 'hours' },
      { id: 's7', type: 'push', templateName: 'Dernière chance' }
    ],
    enrolledCount: 8750,
    completedCount: 6200,
    conversionRate: 18.2,
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    name: 'Win-back Client Inactif',
    description: 'Réactivation clients inactifs 30+ jours',
    trigger: 'Inactivité 30 jours',
    status: 'paused',
    steps: [
      { id: 's1', type: 'email', templateName: 'On vous manque!' },
      { id: 's2', type: 'wait', delay: 3, delayUnit: 'days' },
      { id: 's3', type: 'condition', condition: { type: 'opened' } },
      { id: 's4', type: 'sms', templateName: 'Offre exclusive' }
    ],
    enrolledCount: 1200,
    completedCount: 890,
    conversionRate: 12.8,
    createdAt: '2024-02-01'
  }
];

export function MultiChannelSequences() {
  const [sequences, setSequences] = useState<Sequence[]>(mockSequences);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'sms': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'push': return <Bell className="h-4 w-4 text-purple-500" />;
      case 'wait': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'condition': return <GitBranch className="h-4 w-4 text-pink-500" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getStepLabel = (step: SequenceStep) => {
    switch (step.type) {
      case 'email':
      case 'sms':
      case 'push':
        return step.templateName || step.type.toUpperCase();
      case 'wait':
        return `Attendre ${step.delay} ${step.delayUnit}`;
      case 'condition':
        const conditionLabels: Record<string, string> = {
          'opened': 'Si ouvert',
          'clicked': 'Si cliqué',
          'converted': 'Si converti',
          'not_opened': 'Si non ouvert'
        };
        return conditionLabels[step.condition?.type || ''] || 'Condition';
      default:
        return step.type;
    }
  };

  const toggleStatus = (id: string) => {
    setSequences(sequences.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'active' ? 'paused' : 'active';
        toast.success(`Séquence ${newStatus === 'active' ? 'activée' : 'mise en pause'}`);
        return { ...s, status: newStatus };
      }
      return s;
    }));
  };

  const deleteSequence = (id: string) => {
    setSequences(sequences.filter(s => s.id !== id));
    toast.success('Séquence supprimée');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Séquences Multi-Canal</h2>
          <p className="text-muted-foreground">
            Créez des workflows automatisés email → SMS → push
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle séquence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une séquence</DialogTitle>
              <DialogDescription>
                Définissez les étapes de votre workflow multi-canal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de la séquence</Label>
                  <Input placeholder="Ex: Onboarding client" />
                </div>
                <div className="space-y-2">
                  <Label>Déclencheur</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signup">Inscription</SelectItem>
                      <SelectItem value="cart">Panier abandonné</SelectItem>
                      <SelectItem value="purchase">Achat effectué</SelectItem>
                      <SelectItem value="inactive">Inactivité</SelectItem>
                      <SelectItem value="birthday">Anniversaire</SelectItem>
                      <SelectItem value="custom">Événement personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Étapes du workflow</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="flex-1">Email de bienvenue</span>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="flex-1">Attendre 24h</span>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une étape
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  toast.success('Séquence créée');
                  setIsCreateOpen(false);
                }}>
                  Créer la séquence
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Séquences actives</p>
            <p className="text-2xl font-bold">{sequences.filter(s => s.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Contacts en cours</p>
            <p className="text-2xl font-bold">
              {sequences.reduce((acc, s) => acc + s.enrolledCount - s.completedCount, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Taux de complétion</p>
            <p className="text-2xl font-bold text-green-600">
              {(sequences.reduce((acc, s) => acc + s.completedCount, 0) / 
                sequences.reduce((acc, s) => acc + s.enrolledCount, 0) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Conversion moyenne</p>
            <p className="text-2xl font-bold text-purple-600">
              {(sequences.reduce((acc, s) => acc + s.conversionRate, 0) / sequences.length).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sequences List */}
      <div className="space-y-4">
        {sequences.map((sequence) => (
          <Card key={sequence.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{sequence.name}</CardTitle>
                    <Badge variant={sequence.status === 'active' ? 'default' : 'secondary'}>
                      {sequence.status === 'active' ? 'Active' : sequence.status === 'paused' ? 'En pause' : 'Brouillon'}
                    </Badge>
                  </div>
                  <CardDescription>{sequence.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStatus(sequence.id)}
                  >
                    {sequence.status === 'active' ? (
                      <><Pause className="h-4 w-4 mr-1" /> Pause</>
                    ) : (
                      <><Play className="h-4 w-4 mr-1" /> Activer</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteSequence(sequence.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Workflow Steps Visualization */}
              <div className="flex items-center gap-1 overflow-x-auto py-2 mb-4">
                <Badge variant="outline" className="whitespace-nowrap">
                  <Zap className="h-3 w-3 mr-1" />
                  {sequence.trigger}
                </Badge>
                {sequence.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                    <Badge 
                      variant="secondary" 
                      className="whitespace-nowrap flex items-center gap-1"
                    >
                      {getStepIcon(step.type)}
                      {getStepLabel(step)}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Inscrits</p>
                  <p className="font-medium">{sequence.enrolledCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Complétés</p>
                  <p className="font-medium">{sequence.completedCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conversion</p>
                  <p className="font-medium text-green-600">{sequence.conversionRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Créé le</p>
                  <p className="font-medium">{sequence.createdAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
