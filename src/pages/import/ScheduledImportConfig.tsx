import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Play, Calendar, Clock, Repeat, Bell, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ScheduledJob {
  id: string;
  name: string;
  type: 'url' | 'xml' | 'ftp' | 'csv';
  source: string;
  frequency: string;
  next_run: string;
  enabled: boolean;
}

const ScheduledImportConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [newJob, setNewJob] = useState({
    name: '',
    type: 'url' as 'url' | 'xml' | 'ftp' | 'csv',
    source: '',
    frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom',
    time: '02:00',
    days: [] as string[],
    custom_cron: '',
    enabled: true,
    notifications: {
      email_on_success: false,
      email_on_error: true,
      webhook_url: ''
    },
    retry_policy: {
      max_retries: 3,
      retry_delay: 300,
      exponential_backoff: true
    },
    filters: {
      batch_size: 100,
      max_items: 1000,
      timeout: 300
    }
  });

  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([
    {
      id: '1',
      name: 'Import produits BigBuy',
      type: 'xml',
      source: 'https://bigbuy.eu/catalog.xml',
      frequency: 'daily',
      next_run: '2024-01-15 02:00:00',
      enabled: true
    },
    {
      id: '2',
      name: 'Synchronisation stock FTP',
      type: 'ftp',
      source: 'ftp.supplier.com/stock.csv',
      frequency: 'hourly',
      next_run: '2024-01-14 15:00:00',
      enabled: true
    },
    {
      id: '3',
      name: 'Import AliExpress',
      type: 'url',
      source: 'https://aliexpress.com/category/electronics',
      frequency: 'weekly',
      next_run: '2024-01-21 03:00:00',
      enabled: false
    }
  ]);

  const daysOfWeek = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' },
    { value: 'saturday', label: 'Samedi' },
    { value: 'sunday', label: 'Dimanche' }
  ];

  const handleCreateJob = () => {
    if (!newJob.name || !newJob.source) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez remplir au moins le nom et la source.",
        variant: "destructive"
      });
      return;
    }

    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 1);
    
    const job: ScheduledJob = {
      id: Date.now().toString(),
      name: newJob.name,
      type: newJob.type,
      source: newJob.source,
      frequency: newJob.frequency,
      next_run: nextRun.toISOString(),
      enabled: newJob.enabled
    };

    setScheduledJobs([...scheduledJobs, job]);
    setNewJob({
      ...newJob,
      name: '',
      source: ''
    });

    toast({
      title: "Job programmé créé",
      description: `Le job "${job.name}" a été programmé avec succès.`
    });
  };

  const handleToggleJob = (jobId: string) => {
    setScheduledJobs(jobs => 
      jobs.map(job => 
        job.id === jobId 
          ? { ...job, enabled: !job.enabled }
          : job
      )
    );
  };

  const handleDeleteJob = (jobId: string) => {
    setScheduledJobs(jobs => jobs.filter(job => job.id !== jobId));
    toast({
      title: "Job supprimé",
      description: "Le job programmé a été supprimé."
    });
  };

  const handleRunNow = (jobId: string) => {
    const job = scheduledJobs.find(j => j.id === jobId);
    if (job) {
      toast({
        title: "Job lancé",
        description: `Le job "${job.name}" a été exécuté manuellement.`
      });
    }
  };

  const toggleDay = (day: string) => {
    setNewJob(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/import')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configuration Import Programmé</h1>
          <p className="text-muted-foreground">Planifiez vos imports automatiques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Création d'un nouveau job */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nouveau job programmé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_name">Nom du job</Label>
                  <Input
                    id="job_name"
                    placeholder="Import produits quotidien"
                    value={newJob.name}
                    onChange={(e) => setNewJob({...newJob, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="job_type">Type d'import</Label>
                  <Select value={newJob.type} onValueChange={(value) => setNewJob({...newJob, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">Import par URL</SelectItem>
                      <SelectItem value="xml">Flux XML/RSS</SelectItem>
                      <SelectItem value="ftp">FTP/SFTP</SelectItem>
                      <SelectItem value="csv">Fichier CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="job_source">Source</Label>
                <Input
                  id="job_source"
                  placeholder="https://exemple.com/products.xml"
                  value={newJob.source}
                  onChange={(e) => setNewJob({...newJob, source: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select value={newJob.frequency} onValueChange={(value) => setNewJob({...newJob, frequency: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="custom">Personnalisée (CRON)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="job_time">Heure d'exécution</Label>
                  <Input
                    id="job_time"
                    type="time"
                    value={newJob.time}
                    onChange={(e) => setNewJob({...newJob, time: e.target.value})}
                  />
                </div>
              </div>

              {newJob.frequency === 'weekly' && (
                <div>
                  <Label>Jours de la semaine</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        size="sm"
                        variant={newJob.days.includes(day.value) ? "default" : "outline"}
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {newJob.frequency === 'custom' && (
                <div>
                  <Label htmlFor="custom_cron">Expression CRON</Label>
                  <Input
                    id="custom_cron"
                    placeholder="0 2 * * *"
                    value={newJob.custom_cron}
                    onChange={(e) => setNewJob({...newJob, custom_cron: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: minute heure jour mois jour-semaine
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="job_enabled">Activer le job</Label>
                <Switch
                  id="job_enabled"
                  checked={newJob.enabled}
                  onCheckedChange={(checked) => setNewJob({...newJob, enabled: checked})}
                />
              </div>

              <Button onClick={handleCreateJob} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Créer le job
              </Button>
            </CardContent>
          </Card>

          {/* Configuration avancée */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Configuration avancée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="batch_size">Taille des lots</Label>
                  <Input
                    id="batch_size"
                    type="number"
                    value={newJob.filters.batch_size}
                    onChange={(e) => setNewJob({
                      ...newJob, 
                      filters: {...newJob.filters, batch_size: parseInt(e.target.value)}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="max_items">Éléments maximum</Label>
                  <Input
                    id="max_items"
                    type="number"
                    value={newJob.filters.max_items}
                    onChange={(e) => setNewJob({
                      ...newJob, 
                      filters: {...newJob.filters, max_items: parseInt(e.target.value)}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="timeout">Timeout (sec)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={newJob.filters.timeout}
                    onChange={(e) => setNewJob({
                      ...newJob, 
                      filters: {...newJob.filters, timeout: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_retries">Reprises max</Label>
                  <Input
                    id="max_retries"
                    type="number"
                    min="0"
                    max="10"
                    value={newJob.retry_policy.max_retries}
                    onChange={(e) => setNewJob({
                      ...newJob, 
                      retry_policy: {...newJob.retry_policy, max_retries: parseInt(e.target.value)}
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="retry_delay">Délai reprise (sec)</Label>
                  <Input
                    id="retry_delay"
                    type="number"
                    value={newJob.retry_policy.retry_delay}
                    onChange={(e) => setNewJob({
                      ...newJob, 
                      retry_policy: {...newJob.retry_policy, retry_delay: parseInt(e.target.value)}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between pt-8">
                  <Label htmlFor="exponential_backoff">Backoff exponentiel</Label>
                  <Switch
                    id="exponential_backoff"
                    checked={newJob.retry_policy.exponential_backoff}
                    onCheckedChange={(checked) => setNewJob({
                      ...newJob, 
                      retry_policy: {...newJob.retry_policy, exponential_backoff: checked}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_success">Email si succès</Label>
                  <Switch
                    id="email_success"
                    checked={newJob.notifications.email_on_success}
                    onCheckedChange={(checked) => setNewJob({
                      ...newJob, 
                      notifications: {...newJob.notifications, email_on_success: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email_error">Email si erreur</Label>
                  <Switch
                    id="email_error"
                    checked={newJob.notifications.email_on_error}
                    onCheckedChange={(checked) => setNewJob({
                      ...newJob, 
                      notifications: {...newJob.notifications, email_on_error: checked}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://votre-site.com/webhook"
                  value={newJob.notifications.webhook_url}
                  onChange={(e) => setNewJob({
                    ...newJob, 
                    notifications: {...newJob.notifications, webhook_url: e.target.value}
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs programmés existants */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Jobs programmés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scheduledJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{job.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{job.source}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRunNow(job.id)}
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {job.type.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {job.frequency}
                      </Badge>
                    </div>
                    <Switch
                      checked={job.enabled}
                      onCheckedChange={() => handleToggleJob(job.id)}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Prochaine exécution: {new Date(job.next_run).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}

              {scheduledJobs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun job programmé</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jobs actifs:</span>
                  <span>{scheduledJobs.filter(j => j.enabled).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jobs total:</span>
                  <span>{scheduledJobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prochaine exécution:</span>
                  <span className="text-xs">
                    {scheduledJobs.length > 0 
                      ? new Date(Math.min(...scheduledJobs.map(j => new Date(j.next_run).getTime()))).toLocaleString('fr-FR')
                      : 'Aucune'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScheduledImportConfig;