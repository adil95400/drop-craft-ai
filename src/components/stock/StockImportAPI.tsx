import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  Link, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Trash2,
  Play,
  Settings
} from 'lucide-react';

interface ImportJob {
  id: string;
  source_type: 'csv' | 'api' | '3pl_sync' | 'manual';
  source_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  created_at: string;
  completed_at?: string;
}

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  mapping: Record<string, string>;
  schedule: string;
  last_sync?: string;
  is_active: boolean;
}

export function StockImportAPI() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('csv');
  const [isUploading, setIsUploading] = useState(false);
  const [showEndpointDialog, setShowEndpointDialog] = useState(false);
  
  // Mock data
  const [importJobs, setImportJobs] = useState<ImportJob[]>([
    {
      id: '1',
      source_type: 'csv',
      source_name: 'stock_update_2024.csv',
      status: 'completed',
      total_items: 150,
      processed_items: 150,
      successful_items: 148,
      failed_items: 2,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3500000).toISOString()
    },
    {
      id: '2',
      source_type: 'api',
      source_name: 'Bigblue Sync',
      status: 'processing',
      total_items: 89,
      processed_items: 45,
      successful_items: 45,
      failed_items: 0,
      created_at: new Date().toISOString()
    }
  ]);

  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([
    {
      id: '1',
      name: 'Bigblue Stock API',
      url: 'https://api.bigblue.co/v1/inventory',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ***' },
      mapping: { 'sku': 'product_sku', 'quantity': 'available_quantity' },
      schedule: 'hourly',
      last_sync: new Date(Date.now() - 1800000).toISOString(),
      is_active: true
    }
  ]);

  const [newEndpoint, setNewEndpoint] = useState<{
    name: string;
    url: string;
    method: 'GET' | 'POST';
    api_key: string;
    schedule: string;
  }>({
    name: '',
    url: '',
    method: 'GET',
    api_key: '',
    schedule: 'daily'
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Simulate file processing
    const newJob: ImportJob = {
      id: Date.now().toString(),
      source_type: 'csv',
      source_name: file.name,
      status: 'processing',
      total_items: 0,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      created_at: new Date().toISOString()
    };

    setImportJobs(prev => [newJob, ...prev]);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setImportJobs(prev => prev.map(job => 
      job.id === newJob.id 
        ? { 
            ...job, 
            status: 'completed' as const, 
            total_items: 75,
            processed_items: 75,
            successful_items: 73,
            failed_items: 2,
            completed_at: new Date().toISOString()
          }
        : job
    ));

    setIsUploading(false);
    toast({
      title: "Import terminé",
      description: "75 produits importés, 73 succès, 2 erreurs"
    });
  };

  const handleAddEndpoint = async () => {
    const endpoint: APIEndpoint = {
      id: Date.now().toString(),
      name: newEndpoint.name,
      url: newEndpoint.url,
      method: newEndpoint.method,
      headers: { 'Authorization': `Bearer ${newEndpoint.api_key}` },
      mapping: {},
      schedule: newEndpoint.schedule,
      is_active: true
    };

    setApiEndpoints(prev => [...prev, endpoint]);
    setShowEndpointDialog(false);
    setNewEndpoint({ name: '', url: '', method: 'GET', api_key: '', schedule: 'daily' });

    toast({
      title: "Endpoint ajouté",
      description: `${endpoint.name} configuré pour synchronisation ${endpoint.schedule}`
    });
  };

  const handleSyncNow = async (endpointId: string) => {
    const endpoint = apiEndpoints.find(e => e.id === endpointId);
    if (!endpoint) return;

    const newJob: ImportJob = {
      id: Date.now().toString(),
      source_type: 'api',
      source_name: endpoint.name,
      status: 'processing',
      total_items: 0,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      created_at: new Date().toISOString()
    };

    setImportJobs(prev => [newJob, ...prev]);

    await new Promise(resolve => setTimeout(resolve, 3000));

    setImportJobs(prev => prev.map(job => 
      job.id === newJob.id 
        ? { 
            ...job, 
            status: 'completed' as const, 
            total_items: 45,
            processed_items: 45,
            successful_items: 45,
            failed_items: 0,
            completed_at: new Date().toISOString()
          }
        : job
    ));

    setApiEndpoints(prev => prev.map(e => 
      e.id === endpointId ? { ...e, last_sync: new Date().toISOString() } : e
    ));

    toast({
      title: "Synchronisation terminée",
      description: `${endpoint.name}: 45 produits mis à jour`
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Terminé</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Échoué</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
  };

  const downloadTemplate = () => {
    const csvContent = "sku,product_name,warehouse_code,quantity,reorder_point,cost_per_unit\nSKU001,Produit 1,WH-PARIS,100,20,5.99\nSKU002,Produit 2,WH-LYON,50,10,12.50";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import de stock via API
          </h2>
          <p className="text-sm text-muted-foreground">
            Importez et synchronisez vos stocks depuis des fichiers ou APIs externes
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="csv">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import CSV
          </TabsTrigger>
          <TabsTrigger value="api">
            <Link className="h-4 w-4 mr-2" />
            Endpoints API
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import de fichier CSV</CardTitle>
              <CardDescription>
                Téléchargez un fichier CSV avec les niveaux de stock à mettre à jour
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Glissez-déposez un fichier CSV ou cliquez pour sélectionner
                </p>
                <div className="flex justify-center gap-4">
                  <label>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <Button disabled={isUploading} asChild>
                      <span>
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Import en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Sélectionner un fichier
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger template
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Format attendu</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Le fichier doit contenir les colonnes suivantes :
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">sku (requis)</Badge>
                  <Badge variant="outline">quantity (requis)</Badge>
                  <Badge variant="outline">warehouse_code</Badge>
                  <Badge variant="outline">reorder_point</Badge>
                  <Badge variant="outline">cost_per_unit</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Endpoints API configurés</CardTitle>
                  <CardDescription>
                    Synchronisez automatiquement les stocks depuis vos systèmes externes
                  </CardDescription>
                </div>
                <Dialog open={showEndpointDialog} onOpenChange={setShowEndpointDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Link className="h-4 w-4 mr-2" />
                      Ajouter un endpoint
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurer un endpoint API</DialogTitle>
                      <DialogDescription>
                        Ajoutez une source de données externe pour la synchronisation automatique
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          placeholder="Mon API de stock"
                          value={newEndpoint.name}
                          onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL de l'API</Label>
                        <Input
                          placeholder="https://api.example.com/inventory"
                          value={newEndpoint.url}
                          onChange={(e) => setNewEndpoint(prev => ({ ...prev, url: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Méthode</Label>
                          <Select
                            value={newEndpoint.method}
                            onValueChange={(v: 'GET' | 'POST') => setNewEndpoint(prev => ({ ...prev, method: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Fréquence</Label>
                          <Select
                            value={newEndpoint.schedule}
                            onValueChange={(v) => setNewEndpoint(prev => ({ ...prev, schedule: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realtime">Temps réel</SelectItem>
                              <SelectItem value="hourly">Toutes les heures</SelectItem>
                              <SelectItem value="daily">Quotidien</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Clé API</Label>
                        <Input
                          type="password"
                          placeholder="Votre clé d'authentification"
                          value={newEndpoint.api_key}
                          onChange={(e) => setNewEndpoint(prev => ({ ...prev, api_key: e.target.value }))}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowEndpointDialog(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleAddEndpoint} disabled={!newEndpoint.name || !newEndpoint.url}>
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {apiEndpoints.length === 0 ? (
                <div className="text-center py-8">
                  <Link className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun endpoint configuré</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiEndpoints.map(endpoint => (
                    <Card key={endpoint.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{endpoint.name}</h4>
                              <Badge variant={endpoint.is_active ? 'default' : 'secondary'}>
                                {endpoint.is_active ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{endpoint.url}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {endpoint.schedule === 'realtime' ? 'Temps réel' : 
                                 endpoint.schedule === 'hourly' ? 'Toutes les heures' : 'Quotidien'}
                              </span>
                              {endpoint.last_sync && (
                                <span className="text-muted-foreground">
                                  Dernière sync: {new Date(endpoint.last_sync).toLocaleString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSyncNow(endpoint.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Sync
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des imports</CardTitle>
              <CardDescription>
                Consultez l'historique de toutes les opérations d'import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Succès</TableHead>
                    <TableHead className="text-center">Erreurs</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.source_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {job.source_type === 'csv' ? 'CSV' : 
                           job.source_type === 'api' ? 'API' : 
                           job.source_type === '3pl_sync' ? '3PL' : 'Manuel'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{job.total_items}</TableCell>
                      <TableCell className="text-center text-green-600">{job.successful_items}</TableCell>
                      <TableCell className="text-center text-red-600">{job.failed_items}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(job.created_at).toLocaleString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
