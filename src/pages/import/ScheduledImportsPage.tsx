import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Helmet } from 'react-helmet-async';
import { 
  Clock, ArrowLeft, Plus, Play, 
  Pause, Trash2, Calendar, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ScheduledImportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [scheduledImports, setScheduledImports] = useState([
    {
      id: 1,
      name: 'Import quotidien fournisseur A',
      source: 'API',
      frequency: 'daily',
      nextRun: '2024-01-20 08:00',
      status: 'active',
      lastRun: '2024-01-19 08:00',
      lastResult: 'success'
    },
    {
      id: 2,
      name: 'Synchronisation catalogue B',
      source: 'CSV',
      frequency: 'weekly',
      nextRun: '2024-01-22 10:00',
      status: 'paused',
      lastRun: '2024-01-15 10:00',
      lastResult: 'error'
    }
  ]);

  const [newImport, setNewImport] = useState({
    name: '',
    source: '',
    frequency: 'daily',
    time: '08:00'
  });

  const handleCreateImport = () => {
    if (!newImport.name || !newImport.source) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newSchedule = {
      id: Date.now(),
      ...newImport,
      nextRun: `2024-01-20 ${newImport.time}`,
      status: 'active',
      lastRun: null,
      lastResult: null
    };

    setScheduledImports([...scheduledImports, newSchedule]);
    setNewImport({ name: '', source: '', frequency: 'daily', time: '08:00' });
    toast.success('Import programmé créé avec succès!');
  };

  const toggleImport = (id: number) => {
    setScheduledImports(imports => 
      imports.map(imp => 
        imp.id === id 
          ? { ...imp, status: imp.status === 'active' ? 'paused' : 'active' }
          : imp
      )
    );
  };

  const deleteImport = (id: number) => {
    setScheduledImports(imports => imports.filter(imp => imp.id !== id));
    toast.success('Import programmé supprimé');
  };

  const frequencies = [
    { value: 'hourly', label: 'Chaque heure' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' }
  ];

  const sources = [
    { value: 'api', label: 'API' },
    { value: 'csv', label: 'Fichier CSV' },
    { value: 'url', label: 'Web Scraping' },
    { value: 'database', label: 'Base de données' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Imports Programmés - Drop Craft AI</title>
        <meta name="description" content="Programmez et automatisez vos imports de produits." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Imports Programmés</h1>
            <p className="text-muted-foreground">
              Automatisez vos imports avec des planifications récurrentes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create New Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nouvel import programmé
              </CardTitle>
              <CardDescription>
                Créez un nouvel import automatique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'import</Label>
                <Input
                  id="name"
                  placeholder="Import fournisseur X"
                  value={newImport.name}
                  onChange={(e) => setNewImport({...newImport, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={newImport.source} onValueChange={(value) => setNewImport({...newImport, source: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select value={newImport.frequency} onValueChange={(value) => setNewImport({...newImport, frequency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Heure d'exécution</Label>
                <Input
                  id="time"
                  type="time"
                  value={newImport.time}
                  onChange={(e) => setNewImport({...newImport, time: e.target.value})}
                />
              </div>

              <Button onClick={handleCreateImport} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Créer l'import
              </Button>
            </CardContent>
          </Card>

          {/* Scheduled Imports List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Imports programmés ({scheduledImports.length})
                </CardTitle>
                <CardDescription>
                  Gérez vos imports automatiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledImports.length > 0 ? (
                  <div className="space-y-4">
                    {scheduledImports.map((importItem) => (
                      <div key={importItem.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{importItem.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Source: {importItem.source}</span>
                              <span>•</span>
                              <span>{frequencies.find(f => f.value === importItem.frequency)?.label}</span>
                            </div>
                          </div>
                          <Badge 
                            variant={importItem.status === 'active' ? 'default' : 'secondary'}
                            className={getStatusColor(importItem.status)}
                          >
                            {importItem.status === 'active' ? 'Actif' : 'En pause'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Prochaine exécution:</span>
                            <div className="font-medium flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {importItem.nextRun}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Dernière exécution:</span>
                            <div className="flex items-center gap-2">
                              {getResultIcon(importItem.lastResult)}
                              <span className="font-medium">
                                {importItem.lastRun || 'Jamais'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleImport(importItem.id)}
                          >
                            {importItem.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Suspendre
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activer
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Exécuter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteImport(importItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucun import programmé</h3>
                    <p className="text-muted-foreground">
                      Créez votre premier import automatique
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScheduledImportsPage;