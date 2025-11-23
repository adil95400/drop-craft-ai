import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Upload, Link as LinkIcon, FileText, Database, 
  Settings, Zap, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportJob {
  id: string;
  import_type: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  error_rows: number;
  created_at: string;
}

export default function AdvancedImportPage() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { hasFeature } = useUnifiedPlan();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileImport = async (file: File) => {
    if (!hasFeature('advanced_import')) {
      toast({
        title: "Fonctionnalité Pro",
        description: "L'import avancé nécessite un plan Pro ou supérieur",
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('csv-import', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Import lancé",
        description: "Votre fichier est en cours de traitement"
      });
      
      loadJobs();
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlImport = async (url: string) => {
    if (!hasFeature('url_import')) {
      toast({
        title: "Fonctionnalité Ultra Pro",
        description: "L'import par URL nécessite un plan Ultra Pro",
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('url-import', {
        body: { url }
      });

      if (error) throw error;

      toast({
        title: "Import URL lancé",
        description: "Le scraping de l'URL est en cours"
      });
      
      loadJobs();
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setJobs(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products/import')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Import Avancé</h1>
          <p className="text-muted-foreground">
            Importez vos produits depuis multiple sources avec mapping avancé
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">PRO</Badge>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imports totaux</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'processing').length}
            </div>
            <p className="text-xs text-muted-foreground">Jobs actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réussis</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {jobs.reduce((sum, j) => sum + (j.processed_rows || 0), 0)} produits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échecs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">À corriger</p>
          </CardContent>
        </Card>
      </div>

      {/* Sources d'import */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle importation</CardTitle>
          <CardDescription>
            Choisissez votre méthode d'import et configurez les paramètres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="file">
                <FileText className="w-4 h-4 mr-2" />
                Fichier CSV
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="w-4 h-4 mr-2" />
                URL/API
              </TabsTrigger>
              <TabsTrigger value="database">
                <Database className="w-4 h-4 mr-2" />
                Base de données
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <Settings className="w-4 h-4 mr-2" />
                Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">Glissez votre fichier CSV ici</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  ou cliquez pour sélectionner un fichier
                </p>
                <Button className="mt-4" onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv';
                  input.onchange = (e: any) => handleFileImport(e.target.files[0]);
                  input.click();
                }}>
                  Sélectionner un fichier
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">URL du produit ou catalogue</label>
                  <input
                    type="url"
                    placeholder="https://example.com/products"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                  />
                </div>
                <Button onClick={() => handleUrlImport('https://example.com')}>
                  <Zap className="w-4 h-4 mr-2" />
                  Lancer l'import par URL
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connectez-vous à une base de données externe pour importer vos produits.
              </p>
              <Button variant="outline">
                Configurer une connexion
              </Button>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configuration avancée: mapping de colonnes, transformation de données, validation.
              </p>
              <Button variant="outline">
                Accéder aux paramètres avancés
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Historique des imports */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des imports</CardTitle>
          <CardDescription>Vos 10 derniers imports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="mx-auto h-12 w-12 mb-4" />
                <p>Aucun import pour le moment</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium">{job.import_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.processed_rows}/{job.total_rows} produits
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
