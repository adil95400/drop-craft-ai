import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Mail, 
  Plus, 
  Play, 
  Pause,
  Trash2,
  Edit,
  Download,
  Send,
  BarChart3,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  History,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledReport {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'customers' | 'orders' | 'analytics';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel';
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  status: 'success' | 'failed' | 'pending';
}

interface ReportHistory {
  id: string;
  reportId: string;
  reportName: string;
  runDate: Date;
  status: 'success' | 'failed';
  recipients: number;
  fileSize: string;
}

const mockReports: ScheduledReport[] = [
  {
    id: '1',
    name: 'Rapport des ventes hebdomadaire',
    type: 'sales',
    frequency: 'weekly',
    time: '08:00',
    dayOfWeek: 1,
    recipients: ['admin@shopopti.com', 'finance@shopopti.com'],
    format: 'pdf',
    isActive: true,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    status: 'success'
  },
  {
    id: '2',
    name: 'Inventaire mensuel',
    type: 'inventory',
    frequency: 'monthly',
    time: '06:00',
    dayOfMonth: 1,
    recipients: ['stock@shopopti.com'],
    format: 'excel',
    isActive: true,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
    status: 'success'
  },
  {
    id: '3',
    name: 'Analytics quotidien',
    type: 'analytics',
    frequency: 'daily',
    time: '07:00',
    recipients: ['team@shopopti.com'],
    format: 'pdf',
    isActive: false,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24),
    nextRun: new Date(Date.now() + 1000 * 60 * 60 * 12),
    status: 'pending'
  }
];

const mockHistory: ReportHistory[] = [
  { id: '1', reportId: '1', reportName: 'Rapport des ventes hebdomadaire', runDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), status: 'success', recipients: 2, fileSize: '1.2 MB' },
  { id: '2', reportId: '2', reportName: 'Inventaire mensuel', runDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), status: 'success', recipients: 1, fileSize: '3.5 MB' },
  { id: '3', reportId: '1', reportName: 'Rapport des ventes hebdomadaire', runDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), status: 'failed', recipients: 0, fileSize: '0 KB' },
  { id: '4', reportId: '3', reportName: 'Analytics quotidien', runDate: new Date(Date.now() - 1000 * 60 * 60 * 24), status: 'success', recipients: 1, fileSize: '856 KB' }
];

const reportTypes = [
  { value: 'sales', label: 'Ventes', icon: TrendingUp },
  { value: 'inventory', label: 'Inventaire', icon: Package },
  { value: 'customers', label: 'Clients', icon: Users },
  { value: 'orders', label: 'Commandes', icon: ShoppingCart },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 }
];

const getReportIcon = (type: ScheduledReport['type']) => {
  const found = reportTypes.find(t => t.value === type);
  return found ? found.icon : FileText;
};

export function ScheduledReports() {
  const [reports, setReports] = useState<ScheduledReport[]>(mockReports);
  const [history] = useState<ReportHistory[]>(mockHistory);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'sales' as ScheduledReport['type'],
    frequency: 'weekly' as ScheduledReport['frequency'],
    time: '08:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    recipients: '',
    format: 'pdf' as ScheduledReport['format']
  });

  const toggleReport = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
    const report = reports.find(r => r.id === id);
    toast({
      title: report?.isActive ? "Rapport désactivé" : "Rapport activé",
      description: `Le rapport "${report?.name}" a été ${report?.isActive ? 'désactivé' : 'activé'}`
    });
  };

  const deleteReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    toast({
      title: "Rapport supprimé",
      description: "Le rapport planifié a été supprimé"
    });
  };

  const runNow = (report: ScheduledReport) => {
    toast({
      title: "Rapport en cours de génération",
      description: `Le rapport "${report.name}" sera envoyé dans quelques instants`
    });
  };

  const handleSubmit = () => {
    const newReport: ScheduledReport = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      frequency: formData.frequency,
      time: formData.time,
      dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : undefined,
      dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
      recipients: formData.recipients.split(',').map(e => e.trim()),
      format: formData.format,
      isActive: true,
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24),
      status: 'pending'
    };

    setReports([...reports, newReport]);
    setIsDialogOpen(false);
    setFormData({
      name: '',
      type: 'sales',
      frequency: 'weekly',
      time: '08:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      recipients: '',
      format: 'pdf'
    });
    toast({
      title: "✅ Rapport créé",
      description: "Le rapport planifié a été créé avec succès"
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFrequencyLabel = (report: ScheduledReport): string => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    switch (report.frequency) {
      case 'daily': return `Tous les jours à ${report.time}`;
      case 'weekly': return `Chaque ${days[report.dayOfWeek || 0]} à ${report.time}`;
      case 'monthly': return `Le ${report.dayOfMonth} de chaque mois à ${report.time}`;
    }
  };

  const activeReports = reports.filter(r => r.isActive).length;
  const successRate = Math.round((history.filter(h => h.status === 'success').length / history.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rapports planifiés</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-500">{activeReports}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Envoyés ce mois</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="scheduled">Planifiés</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau rapport
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un rapport planifié</DialogTitle>
                <DialogDescription>
                  Configurez un rapport automatique à envoyer par email
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom du rapport</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Rapport des ventes hebdomadaire"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type de rapport</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(v) => setFormData({...formData, frequency: v as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Heure</Label>
                    <Input 
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                </div>

                {formData.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Jour de la semaine</Label>
                    <Select 
                      value={formData.dayOfWeek.toString()} 
                      onValueChange={(v) => setFormData({...formData, dayOfWeek: parseInt(v)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Lundi</SelectItem>
                        <SelectItem value="2">Mardi</SelectItem>
                        <SelectItem value="3">Mercredi</SelectItem>
                        <SelectItem value="4">Jeudi</SelectItem>
                        <SelectItem value="5">Vendredi</SelectItem>
                        <SelectItem value="6">Samedi</SelectItem>
                        <SelectItem value="0">Dimanche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Jour du mois</Label>
                    <Select 
                      value={formData.dayOfMonth.toString()} 
                      onValueChange={(v) => setFormData({...formData, dayOfMonth: parseInt(v)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 28}, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Destinataires (séparés par virgule)</Label>
                  <Input 
                    value={formData.recipients}
                    onChange={(e) => setFormData({...formData, recipients: e.target.value})}
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select 
                    value={formData.format} 
                    onValueChange={(v) => setFormData({...formData, format: v as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.recipients}>
                  Créer le rapport
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="scheduled" className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun rapport planifié</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre premier rapport automatique
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un rapport
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => {
                const Icon = getReportIcon(report.type);
                return (
                  <Card key={report.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            report.isActive ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            <Icon className={`h-6 w-6 ${report.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{report.name}</span>
                              <Badge variant={report.isActive ? 'default' : 'secondary'}>
                                {report.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                              <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getFrequencyLabel(report)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {report.recipients.length} destinataire(s)
                              </span>
                            </div>
                            {report.lastRun && (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span>Dernier envoi: {formatDate(report.lastRun)}</span>
                                {report.status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                {report.status === 'failed' && <XCircle className="h-3 w-3 text-red-500" />}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Prochain envoi: {formatDate(report.nextRun)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => runNow(report)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Envoyer
                          </Button>
                          <Switch
                            checked={report.isActive}
                            onCheckedChange={() => toggleReport(report.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des envois</CardTitle>
              <CardDescription>Les 30 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {item.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <span className="font-medium">{item.reportName}</span>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(item.runDate)} • {item.recipients} destinataire(s) • {item.fileSize}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
