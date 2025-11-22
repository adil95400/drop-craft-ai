import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle,
  Globe,
  ShoppingBag,
  Package
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const importSources = [
  {
    id: 'aliexpress',
    name: 'AliExpress',
    icon: ShoppingBag,
    type: 'Marketplace',
    status: 'active',
    productsImported: 1250,
    lastSync: '2025-11-22 10:30',
    autoSync: true
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: Package,
    type: 'Marketplace',
    status: 'active',
    productsImported: 890,
    lastSync: '2025-11-22 09:15',
    autoSync: false
  },
  {
    id: 'cj-dropshipping',
    name: 'CJ Dropshipping',
    icon: Globe,
    type: 'Supplier',
    status: 'inactive',
    productsImported: 0,
    lastSync: null,
    autoSync: false
  },
  {
    id: 'csv-custom',
    name: 'CSV Personnalisé',
    icon: Database,
    type: 'File',
    status: 'active',
    productsImported: 350,
    lastSync: '2025-11-21 16:45',
    autoSync: false
  }
];

export default function ImportSources() {
  const [sources, setSources] = useState(importSources);

  const toggleAutoSync = (sourceId: string) => {
    setSources(sources.map(s => 
      s.id === sourceId ? { ...s, autoSync: !s.autoSync } : s
    ));
    toast.success('Synchronisation automatique mise à jour');
  };

  const toggleStatus = (sourceId: string) => {
    setSources(sources.map(s => 
      s.id === sourceId 
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } 
        : s
    ));
    toast.success('Statut de la source mis à jour');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sources d'Import</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos sources d'importation de produits
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une Source
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sources Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {sources.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Produits Importés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {sources.reduce((sum, s) => sum + s.productsImported, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Auto-Sync Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {sources.filter(s => s.autoSync).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Types de Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(sources.map(s => s.type)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {sources.map((source) => {
          const Icon = source.icon;
          const isActive = source.status === 'active';

          return (
            <Card key={source.id} className={!isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{source.type}</Badge>
                        {isActive ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactif
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.info('Configuration de la source')}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => toggleStatus(source.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Produits importés</p>
                    <p className="text-2xl font-bold">{source.productsImported}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Dernière synchro</p>
                    <p className="text-sm font-medium">
                      {source.lastSync || 'Jamais'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Sync automatique</p>
                    <Switch
                      checked={source.autoSync}
                      onCheckedChange={() => toggleAutoSync(source.id)}
                      disabled={!isActive}
                    />
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">
                      Synchroniser Maintenant
                    </Button>
                    <Button size="sm" variant="outline">
                      Voir l'Historique
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Types de Sources Disponibles</CardTitle>
          <CardDescription>
            Ajoutez de nouvelles sources pour enrichir votre catalogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <ShoppingBag className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium">Marketplaces</h4>
              <p className="text-sm text-muted-foreground">
                Amazon, eBay, Etsy, AliExpress
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Globe className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium">Fournisseurs</h4>
              <p className="text-sm text-muted-foreground">
                CJ, Spocket, Modalyst, Oberlo
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Database className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium">Fichiers</h4>
              <p className="text-sm text-muted-foreground">
                CSV, Excel, JSON, XML
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
