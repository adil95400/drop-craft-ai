// AUTO FULFILLMENT - Traitement automatisé des commandes style AutoDS
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Settings, 
  Play, 
  Pause,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  Truck,
  Upload,
  RefreshCw,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

interface FulfillmentRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: number;
}

interface FulfillmentJob {
  id: string;
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  steps: {
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }[];
  supplier: string;
  startedAt?: string;
  completedAt?: string;
  trackingNumber?: string;
  error?: string;
}

const MOCK_RULES: FulfillmentRule[] = [
  {
    id: '1',
    name: 'Commandes payées auto-fulfillment',
    condition: 'Statut = "Payée"',
    action: 'Commander automatiquement chez le fournisseur',
    enabled: true,
    priority: 1
  },
  {
    id: '2',
    name: 'Upload tracking automatique',
    condition: 'Numéro de suivi reçu',
    action: 'Mettre à jour la commande et notifier le client',
    enabled: true,
    priority: 2
  },
  {
    id: '3',
    name: 'Stock bas - Fournisseur alternatif',
    condition: 'Stock fournisseur principal < 5',
    action: 'Commander chez fournisseur de backup',
    enabled: false,
    priority: 3
  }
];

const MOCK_JOBS: FulfillmentJob[] = [
  {
    id: '1',
    orderId: 'ORD-2024-101',
    status: 'completed',
    steps: [
      { name: 'Vérification stock', status: 'completed' },
      { name: 'Passage commande fournisseur', status: 'completed' },
      { name: 'Récupération tracking', status: 'completed' },
      { name: 'Mise à jour boutique', status: 'completed' }
    ],
    supplier: 'BigBuy',
    startedAt: '2024-12-10 10:30',
    completedAt: '2024-12-10 10:32',
    trackingNumber: 'BB123456789FR'
  },
  {
    id: '2',
    orderId: 'ORD-2024-102',
    status: 'processing',
    steps: [
      { name: 'Vérification stock', status: 'completed' },
      { name: 'Passage commande fournisseur', status: 'processing' },
      { name: 'Récupération tracking', status: 'pending' },
      { name: 'Mise à jour boutique', status: 'pending' }
    ],
    supplier: 'CJ Dropshipping',
    startedAt: '2024-12-10 11:15'
  },
  {
    id: '3',
    orderId: 'ORD-2024-103',
    status: 'failed',
    steps: [
      { name: 'Vérification stock', status: 'completed' },
      { name: 'Passage commande fournisseur', status: 'failed' },
      { name: 'Récupération tracking', status: 'pending' },
      { name: 'Mise à jour boutique', status: 'pending' }
    ],
    supplier: 'AliExpress',
    startedAt: '2024-12-10 09:00',
    error: 'Produit en rupture de stock chez le fournisseur'
  }
];

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  processing: { label: 'En cours', color: 'bg-blue-500', icon: RefreshCw },
  completed: { label: 'Terminé', color: 'bg-green-500', icon: CheckCircle2 },
  failed: { label: 'Échec', color: 'bg-red-500', icon: AlertCircle }
};

export default function AutoFulfillment() {
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [rules, setRules] = useState<FulfillmentRule[]>(MOCK_RULES);
  const [jobs, setJobs] = useState<FulfillmentJob[]>(MOCK_JOBS);
  const [selectedSupplier, setSelectedSupplier] = useState('all');

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
    toast.success('Règle mise à jour');
  };

  const processOrder = (orderId: string) => {
    const newJob: FulfillmentJob = {
      id: Date.now().toString(),
      orderId,
      status: 'processing',
      steps: [
        { name: 'Vérification stock', status: 'processing' },
        { name: 'Passage commande fournisseur', status: 'pending' },
        { name: 'Récupération tracking', status: 'pending' },
        { name: 'Mise à jour boutique', status: 'pending' }
      ],
      supplier: 'BigBuy',
      startedAt: new Date().toLocaleString('fr-FR')
    };
    
    setJobs(prev => [newJob, ...prev]);
    toast.success(`Traitement de la commande ${orderId} démarré`);

    // Simulation progression
    setTimeout(() => {
      setJobs(prev => prev.map(j => 
        j.id === newJob.id 
          ? { 
              ...j, 
              steps: j.steps.map((s, i) => 
                i === 0 ? { ...s, status: 'completed' as const } :
                i === 1 ? { ...s, status: 'processing' as const } : s
              )
            }
          : j
      ));
    }, 2000);
  };

  const retryJob = (id: string) => {
    setJobs(prev => prev.map(j => 
      j.id === id 
        ? { 
            ...j, 
            status: 'processing' as const, 
            error: undefined,
            steps: j.steps.map(s => ({ ...s, status: 'pending' as const }))
          }
        : j
    ));
    toast.info('Nouvelle tentative de traitement...');
  };

  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const processingJobs = jobs.filter(j => j.status === 'processing').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header avec toggle global */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isAutoEnabled ? 'bg-green-500' : 'bg-muted'}`}>
                <Zap className={`h-6 w-6 ${isAutoEnabled ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Auto-Fulfillment</h3>
                <p className="text-sm text-muted-foreground">
                  Traitement automatique des commandes comme AutoDS
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge className={isAutoEnabled ? 'bg-green-500' : 'bg-muted'}>
                  {isAutoEnabled ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <Switch
                checked={isAutoEnabled}
                onCheckedChange={setIsAutoEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes traitées</p>
                <p className="text-2xl font-bold">{completedJobs}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{processingJobs}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold">{failedJobs}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold">
                  {jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion du fulfillment</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="jobs">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jobs">Jobs en cours</TabsTrigger>
              <TabsTrigger value="rules">Règles d'automatisation</TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="space-y-4 mt-4">
              {/* Actions */}
              <div className="flex items-center gap-4 mb-4">
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tous les fournisseurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les fournisseurs</SelectItem>
                    <SelectItem value="bigbuy">BigBuy</SelectItem>
                    <SelectItem value="cj">CJ Dropshipping</SelectItem>
                    <SelectItem value="aliexpress">AliExpress</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => processOrder(`ORD-${Date.now()}`)}>
                  <Play className="h-4 w-4 mr-2" />
                  Traiter commande
                </Button>
              </div>

              {/* Liste des jobs */}
              {jobs.map((job) => {
                const StatusIcon = STATUS_CONFIG[job.status].icon;
                const completedSteps = job.steps.filter(s => s.status === 'completed').length;
                const progress = (completedSteps / job.steps.length) * 100;

                return (
                  <div 
                    key={job.id}
                    className="p-4 rounded-lg border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${STATUS_CONFIG[job.status].color}`}>
                          <StatusIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{job.orderId}</p>
                            <Badge variant="outline">{job.supplier}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Démarré: {job.startedAt}
                            {job.completedAt && ` • Terminé: ${job.completedAt}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.trackingNumber && (
                          <Badge className="bg-green-500/10 text-green-500">
                            {job.trackingNumber}
                          </Badge>
                        )}
                        {job.status === 'failed' && (
                          <Button size="sm" variant="outline" onClick={() => retryJob(job.id)}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Réessayer
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center gap-2 text-sm">
                        {job.steps.map((step, index) => (
                          <div key={index} className="flex items-center gap-1">
                            {step.status === 'completed' && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                            {step.status === 'processing' && (
                              <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
                            )}
                            {step.status === 'failed' && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                            {step.status === 'pending' && (
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className={step.status === 'completed' ? 'text-green-500' : 
                                           step.status === 'processing' ? 'text-blue-500' :
                                           step.status === 'failed' ? 'text-red-500' : 'text-muted-foreground'}>
                              {step.name}
                            </span>
                            {index < job.steps.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {job.error && (
                      <div className="p-2 rounded bg-red-500/10 text-red-500 text-sm">
                        {job.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="rules" className="space-y-4 mt-4">
              {rules.map((rule) => (
                <div 
                  key={rule.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${rule.enabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                      <Settings className={`h-5 w-5 ${rule.enabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Si: {rule.condition} → Alors: {rule.action}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Priorité {rule.priority}</Badge>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une règle
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
