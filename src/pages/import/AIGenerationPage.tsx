import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import { Brain, ArrowLeft, Wand2, Sparkles, CheckCircle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase-env';

const AIGenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedProducts, setGeneratedProducts] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Veuillez saisir une description');
      return;
    }

    setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call Lovable AI Gateway for product generation
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chatbot-support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Tu es un assistant spécialisé dans la création de fiches produits e-commerce. Génère exactement 5 produits au format JSON array. Chaque produit doit avoir: name, description, price (number), category, features (array of strings). Réponds uniquement avec le JSON array, sans markdown ni texte supplémentaire.`
            },
            { role: 'user', content: prompt }
          ],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la génération');

      const text = await response.text();
      // Try to extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const products = JSON.parse(jsonMatch[0]).map((p: any, i: number) => ({
          id: i + 1,
          ...p,
          price: p.price || Math.floor(Math.random() * 100) + 20,
        }));
        setGeneratedProducts(products);
        toast.success('Produits générés avec succès!');
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Erreur lors de la génération IA. Réessayez.');
    } finally {
      setGenerating(false);
    }
  };

  const importProduct = async (product: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Connectez-vous pour importer'); return; }

      const { error } = await supabase.from('products').insert({
        user_id: session.user.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        status: 'draft',
        tags: product.features || [],
      } as any);
      if (error) throw error;
      toast.success(`${product.name} importé comme brouillon`);
    } catch (err) {
      toast.error("Erreur lors de l'import");
    }
  };

  const importAll = async () => {
    for (const p of generatedProducts) {
      await importProduct(p);
    }
    toast.success(`${generatedProducts.length} produits importés`);
  };

  const presetPrompts = [
    'Produits électroniques innovants pour la maison connectée',
    'Vêtements éco-responsables pour jeunes adultes',
    'Accessoires de sport outdoor résistants',
    'Produits de beauté naturels et biologiques',
    'Gadgets tech tendance moins de 50€'
  ];

  return (
    <>
      <Helmet>
        <title>Génération IA - Drop Craft AI</title>
        <meta name="description" content="Générez des produits automatiquement avec l'intelligence artificielle." />
      </Helmet>

      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Génération IA</h1>
            <p className="text-muted-foreground">Générez des produits automatiquement avec l'IA</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Configuration IA</CardTitle>
              <CardDescription>Décrivez le type de produits à générer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Description des produits</Label>
                <Textarea id="prompt" placeholder="Ex: Créez 10 produits électroniques innovants pour la maison connectée avec des prix entre 50€ et 200€" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Prompts suggérés</Label>
                <div className="space-y-2">
                  {presetPrompts.map((preset, index) => (
                    <Button key={index} variant="outline" size="sm" className="w-full text-left justify-start h-auto p-3" onClick={() => setPrompt(preset)}>
                      <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                      <span className="text-xs">{preset}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="w-full">
                <Wand2 className="h-4 w-4 mr-2" />{generating ? 'Génération en cours...' : 'Générer les produits'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Produits générés</CardTitle>
              <CardDescription>Résultats de la génération IA</CardDescription>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">L'IA génère vos produits...</p>
                </div>
              ) : generatedProducts.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{generatedProducts.length} produits générés</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Exporter</Button>
                      <Button size="sm" onClick={importAll}><CheckCircle className="h-4 w-4 mr-2" />Importer tous</Button>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedProducts.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge>{product.category}</Badge>
                              <span className="font-semibold text-green-600">{product.price}€</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Button size="sm" variant="outline" onClick={() => importProduct(product)}>Importer</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Prêt à générer</h3>
                  <p className="text-muted-foreground mb-4">Décrivez vos produits et laissez l'IA faire le travail</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AIGenerationPage;
