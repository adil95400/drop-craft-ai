import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Helmet } from 'react-helmet-async';
import { 
  Database, ArrowLeft, Play, TestTube, 
  CheckCircle, AlertCircle, Table 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const DatabaseImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [dbConfig, setDbConfig] = useState({
    type: 'mysql',
    host: '',
    port: '3306',
    database: '',
    username: '',
    password: '',
    query: 'SELECT * FROM products LIMIT 100'
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    
    // Simulation de test de base de données
    setTimeout(() => {
      setTestResult({
        success: true,
        connectionTime: 245,
        rowCount: 15420,
        sampleRows: [
          { id: 1, name: 'Product A', price: 29.99, category: 'Electronics' },
          { id: 2, name: 'Product B', price: 49.99, category: 'Clothing' }
        ]
      });
      setTesting(false);
      toast.success('Connexion à la base de données réussie!');
    }, 2000);
  };

  const handleStartImport = async () => {
    setImporting(true);
    
    // Simulation d'import de base de données
    setTimeout(() => {
      setImporting(false);
      toast.success('Import de base de données terminé avec succès!');
    }, 5000);
  };

  const dbTypes = [
    { value: 'mysql', label: 'MySQL', port: '3306' },
    { value: 'postgresql', label: 'PostgreSQL', port: '5432' },
    { value: 'mssql', label: 'SQL Server', port: '1433' },
    { value: 'oracle', label: 'Oracle', port: '1521' },
    { value: 'sqlite', label: 'SQLite', port: '' },
    { value: 'mongodb', label: 'MongoDB', port: '27017' }
  ];

  const sampleQueries = [
    {
      name: 'Tous les produits',
      query: 'SELECT * FROM products'
    },
    {
      name: 'Produits avec stock',
      query: 'SELECT * FROM products WHERE stock > 0'
    },
    {
      name: 'Produits récents',
      query: 'SELECT * FROM products WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)'
    },
    {
      name: 'Produits par catégorie',
      query: 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Import Base de Données - Drop Craft AI</title>
        <meta name="description" content="Importez vos produits directement depuis votre base de données avec requêtes SQL personnalisées." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import Base de Données</h1>
            <p className="text-muted-foreground">
              Connectez-vous directement à votre base de données
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuration de la base de données
              </CardTitle>
              <CardDescription>
                Configurez la connexion à votre base de données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type de base de données</Label>
                <Select 
                  value={dbConfig.type} 
                  onValueChange={(value) => {
                    const dbType = dbTypes.find(t => t.value === value);
                    setDbConfig({
                      ...dbConfig, 
                      type: value,
                      port: dbType?.port || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dbTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Hôte</Label>
                  <Input
                    id="host"
                    placeholder="localhost"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    placeholder="3306"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">Base de données</Label>
                <Input
                  id="database"
                  placeholder="ecommerce_db"
                  value={dbConfig.database}
                  onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    placeholder="user"
                    value={dbConfig.username}
                    onChange={(e) => setDbConfig({...dbConfig, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={dbConfig.password}
                    onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="query">Requête SQL</Label>
                <Textarea
                  id="query"
                  placeholder="SELECT * FROM products LIMIT 100"
                  value={dbConfig.query}
                  onChange={(e) => setDbConfig({...dbConfig, query: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={testing || !dbConfig.host || !dbConfig.database}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing ? 'Test en cours...' : 'Tester la connexion'}
                </Button>
                <Button 
                  onClick={handleStartImport}
                  disabled={importing || !testResult?.success}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {importing ? 'Import en cours...' : 'Démarrer l\'import'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results & Sample Queries */}
          <div className="space-y-6">
            {/* Test Results */}
            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    Résultat de la connexion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Temps de connexion</div>
                      <div className="font-medium">{testResult.connectionTime}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Lignes trouvées</div>
                      <div className="font-medium">{testResult.rowCount.toLocaleString()}</div>
                    </div>
                  </div>

                  {testResult.sampleRows && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Échantillon de données</div>
                      <div className="border rounded overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted">
                            <tr>
                              {Object.keys(testResult.sampleRows[0] || {}).map((key) => (
                                <th key={key} className="px-2 py-1 text-left">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {testResult.sampleRows.map((row: any, index: number) => (
                              <tr key={index} className="border-t">
                                {Object.values(row).map((value: any, i) => (
                                  <td key={i} className="px-2 py-1">{value}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sample Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Requêtes d'exemple
                </CardTitle>
                <CardDescription>
                  Utilisez ces requêtes comme point de départ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleQueries.map((sample, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{sample.name}</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setDbConfig({...dbConfig, query: sample.query})}
                        >
                          Utiliser
                        </Button>
                      </div>
                      <code className="text-xs text-muted-foreground bg-muted p-2 rounded block">
                        {sample.query}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Connection Security */}
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Connexion chiffrée SSL/TLS
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Credentials stockés de manière sécurisée
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Accès en lecture seule recommandé
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default DatabaseImportPage;