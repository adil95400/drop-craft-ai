import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, PlayCircle, PauseCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed';
  variants: {
    name: string;
    traffic: number;
    conversions: number;
    revenue: number;
  }[];
  startDate?: string;
  endDate?: string;
}

export function ABTestManager() {
  const { toast } = useToast();
  const [tests, setTests] = useState<ABTest[]>([
    {
      id: '1',
      name: 'Page produit - CTA principal',
      status: 'running',
      variants: [
        { name: 'Version A', traffic: 50, conversions: 145, revenue: 12450 },
        { name: 'Version B', traffic: 50, conversions: 168, revenue: 14280 },
      ],
      startDate: '2024-01-15',
    },
    {
      id: '2',
      name: 'Tunnel de paiement - Étapes',
      status: 'draft',
      variants: [
        { name: 'Original (3 étapes)', traffic: 50, conversions: 0, revenue: 0 },
        { name: 'Nouveau (2 étapes)', traffic: 50, conversions: 0, revenue: 0 },
      ],
    },
  ]);

  const handleStartTest = (testId: string) => {
    setTests(tests.map(test => 
      test.id === testId ? { ...test, status: 'running' as const, startDate: new Date().toISOString() } : test
    ));
    toast({
      title: 'Test démarré',
      description: 'Le test A/B a été lancé avec succès',
    });
  };

  const handleStopTest = (testId: string) => {
    setTests(tests.map(test => 
      test.id === testId ? { ...test, status: 'completed' as const, endDate: new Date().toISOString() } : test
    ));
    toast({
      title: 'Test terminé',
      description: 'Le test A/B a été arrêté',
    });
  };

  const getStatusBadge = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Terminé</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  const calculateWinner = (variants: ABTest['variants']) => {
    if (variants[0].conversions === 0 && variants[1].conversions === 0) return null;
    return variants[0].conversions > variants[1].conversions ? 0 : 1;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Créer un nouveau test A/B
          </CardTitle>
          <CardDescription>
            Testez différentes versions de vos pages pour optimiser vos conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="test-name">Nom du test</Label>
              <Input id="test-name" placeholder="Ex: Page d'accueil - Hero section" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="test-type">Type de test</Label>
              <Select>
                <SelectTrigger id="test-type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cta">Call-to-action</SelectItem>
                  <SelectItem value="layout">Mise en page</SelectItem>
                  <SelectItem value="copy">Texte</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Variante A - Trafic (%)</Label>
                <Input type="number" defaultValue="50" min="0" max="100" />
              </div>
              <div className="grid gap-2">
                <Label>Variante B - Trafic (%)</Label>
                <Input type="number" defaultValue="50" min="0" max="100" />
              </div>
            </div>

            <Button className="w-full">
              Créer le test
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Tests actifs</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
          <TabsTrigger value="completed">Terminés</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {tests.filter(t => t.status === 'running').map(test => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{test.name}</CardTitle>
                  {getStatusBadge(test.status)}
                </div>
                <CardDescription>
                  Démarré le {test.startDate && new Date(test.startDate).toLocaleDateString('fr-FR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {test.variants.map((variant, idx) => {
                    const winnerIdx = calculateWinner(test.variants);
                    const isWinner = winnerIdx === idx;
                    return (
                      <div key={variant.name} className={`p-4 rounded-lg border ${isWinner ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{variant.name}</span>
                          {isWinner && (
                            <Badge className="bg-green-500">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Gagnant
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Trafic</span>
                            <p className="text-lg font-bold">{variant.traffic}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Conversions</span>
                            <p className="text-lg font-bold">{variant.conversions}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Revenus</span>
                            <p className="text-lg font-bold">{variant.revenue}€</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleStopTest(test.id)}
                  >
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Arrêter le test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {tests.filter(t => t.status === 'draft').map(test => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{test.name}</CardTitle>
                  {getStatusBadge(test.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {test.variants.map(variant => (
                    <div key={variant.name} className="p-4 rounded-lg border">
                      <span className="font-semibold">{variant.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {variant.traffic}% du trafic
                      </p>
                    </div>
                  ))}
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleStartTest(test.id)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Démarrer le test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tests.filter(t => t.status === 'completed').map(test => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{test.name}</CardTitle>
                  {getStatusBadge(test.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Résultats finaux disponibles
                </p>
                <Button variant="outline" className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Voir le rapport complet
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
