import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Download,
  CheckCircle,
  FileText,
  Tag,
  Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedContent {
  title: string;
  metaDescription: string;
  h1: string;
  keywords: string[];
  content: string;
  alt_texts: string[];
}

interface SEOContentGeneratorProps {
  productName?: string;
  productDescription?: string;
  category?: string;
}

export const SEOContentGenerator = ({ 
  productName = "",
  productDescription = "",
  category = ""
}: SEOContentGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [contentType, setContentType] = useState('product');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('fr');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  
  const { toast } = useToast();

  const generateContent = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Mot-clé manquant",
        description: "Veuillez saisir un mot-clé principal",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    // Simulation de génération IA (à remplacer par un vrai appel API)
    setTimeout(() => {
      const content: GeneratedContent = {
        title: `${keyword} - ${productName || 'Produit de qualité'} | Meilleur Prix`,
        metaDescription: `Découvrez notre sélection de ${keyword.toLowerCase()}. ${productDescription?.substring(0, 100) || 'Produits de haute qualité'} ✓ Livraison rapide ✓ Garantie satisfaction`,
        h1: `${keyword} : Guide complet et sélection 2024`,
        keywords: [
          keyword,
          `${keyword} pas cher`,
          `meilleur ${keyword}`,
          `acheter ${keyword}`,
          `${keyword} en ligne`,
          `${keyword} qualité`,
          `comparatif ${keyword}`,
          `avis ${keyword}`
        ],
        content: `
# ${keyword} : Guide complet et sélection 2024

## Qu'est-ce que ${keyword} ?

${keyword} représente une catégorie de produits essentiels pour ${category || 'votre activité'}. Notre sélection rigoureuse vous garantit des produits de qualité supérieure.

## Pourquoi choisir nos ${keyword} ?

- **Qualité garantie** : Sélection rigoureuse de nos fournisseurs
- **Prix compétitifs** : Meilleur rapport qualité-prix du marché  
- **Livraison rapide** : Expédition sous 24-48h
- **Service client** : Support 7j/7 pour vous accompagner

## Notre sélection de ${keyword}

${productDescription || `Découvrez notre gamme complète de ${keyword} adaptée à tous vos besoins.`}

## Questions fréquentes sur ${keyword}

### Comment choisir le bon ${keyword} ?
Le choix dépend de vos besoins spécifiques, votre budget et l'usage prévu.

### Quelle est la garantie sur ${keyword} ?
Tous nos produits bénéficient d'une garantie satisfait ou remboursé.

## Conclusion

${keyword} est un investissement important. Notre expertise vous garantit le meilleur choix pour vos besoins.
        `,
        alt_texts: [
          `${keyword} de qualité professionnelle`,
          `Meilleur ${keyword} 2024`,
          `${keyword} pas cher et efficace`,
          `Guide d'achat ${keyword}`
        ]
      };

      setGeneratedContent(content);
      setIsGenerating(false);
      toast({
        title: "Contenu généré avec succès",
        description: "Le contenu SEO optimisé est prêt à être utilisé"
      });
    }, 3000);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: `${type} copié dans le presse-papier`
    });
  };

  const exportContent = () => {
    if (!generatedContent) return;
    
    const blob = new Blob([JSON.stringify(generatedContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-content-${keyword.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export réussi",
      description: "Le contenu a été exporté"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Générateur de Contenu IA
        </CardTitle>
        <CardDescription>
          Créez du contenu SEO optimisé automatiquement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mot-clé principal *</label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ex: smartphone waterproof"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Type de contenu</label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Page produit</SelectItem>
                <SelectItem value="category">Page catégorie</SelectItem>
                <SelectItem value="blog">Article de blog</SelectItem>
                <SelectItem value="landing">Page d'atterrissage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Ton</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="friendly">Amical</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="casual">Décontracté</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Langue</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">Anglais</SelectItem>
                <SelectItem value="es">Espagnol</SelectItem>
                <SelectItem value="de">Allemand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bouton de génération */}
        <Button 
          onClick={generateContent} 
          disabled={isGenerating || !keyword.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Générer le contenu SEO
            </>
          )}
        </Button>

        {/* Contenu généré */}
        {generatedContent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Contenu généré
              </h3>
              <Button variant="outline" size="sm" onClick={exportContent}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>

            <Tabs defaultValue="meta" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="meta">Méta</TabsTrigger>
                <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>
              
              <TabsContent value="meta" className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Titre SEO
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedContent.title, 'Titre')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm bg-gray-50 p-2 rounded">{generatedContent.title}</p>
                    <Badge variant="outline" className="mt-2">
                      {generatedContent.title.length} caractères
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Meta Description</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedContent.metaDescription, 'Meta description')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm bg-gray-50 p-2 rounded">{generatedContent.metaDescription}</p>
                    <Badge variant="outline" className="mt-2">
                      {generatedContent.metaDescription.length} caractères
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Titre H1</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedContent.h1, 'Titre H1')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm bg-gray-50 p-2 rounded">{generatedContent.h1}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="keywords" className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Mots-clés suggérés
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedContent.keywords.join(', '), 'Mots-clés')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.keywords.map((kw, index) => (
                      <Badge key={index} variant="secondary">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contenu optimisé
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedContent.content, 'Contenu')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={generatedContent.content}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="images" className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Textes alternatifs suggérés</h4>
                  <div className="space-y-2">
                    {generatedContent.alt_texts.map((alt, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{alt}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(alt, 'Texte alternatif')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};