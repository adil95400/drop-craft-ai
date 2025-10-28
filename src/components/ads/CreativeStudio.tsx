import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdsManagerNew } from '@/hooks/useAdsManagerNew';
import { Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function CreativeStudio() {
  const { campaigns, generateCreative, isGeneratingCreative } = useAdsManagerNew();
  const [formData, setFormData] = useState({
    campaignId: '',
    name: '',
    adType: 'image',
    headline: '',
    description: '',
    callToAction: 'Acheter maintenant',
    aiPrompt: ''
  });
  const [generatedCreative, setGeneratedCreative] = useState<any>(null);

  const handleGenerate = async () => {
    const result = await generateCreative(formData);
    if (result) {
      setGeneratedCreative(result);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Studio de Création IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Générez des créatifs publicitaires performants avec l'intelligence artificielle
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignId">Campagne</Label>
              <Select value={formData.campaignId} onValueChange={(value) => setFormData({ ...formData, campaignId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une campagne" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nom du Créatif</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Promo Hiver - Image 1"
              />
            </div>

            <div>
              <Label htmlFor="adType">Type</Label>
              <Select value={formData.adType} onValueChange={(value) => setFormData({ ...formData, adType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="carousel">Carrousel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="headline">Titre</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Titre accrocheur"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du produit ou de l'offre"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="callToAction">Call-to-Action</Label>
              <Select value={formData.callToAction} onValueChange={(value) => setFormData({ ...formData, callToAction: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acheter maintenant">Acheter maintenant</SelectItem>
                  <SelectItem value="En savoir plus">En savoir plus</SelectItem>
                  <SelectItem value="S'inscrire">S'inscrire</SelectItem>
                  <SelectItem value="Télécharger">Télécharger</SelectItem>
                  <SelectItem value="Réserver">Réserver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="aiPrompt">Prompt IA pour l'image</Label>
              <Textarea
                id="aiPrompt"
                value={formData.aiPrompt}
                onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                placeholder="Ex: Photo professionnelle d'un casque audio noir sur fond blanc minimaliste"
                rows={3}
              />
            </div>

            <Button onClick={handleGenerate} disabled={isGeneratingCreative} className="w-full" size="lg">
              {isGeneratingCreative ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer avec l'IA
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Aperçu du Créatif</h3>
            
            {generatedCreative ? (
              <div className="space-y-4">
                {generatedCreative.imageUrl && (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={generatedCreative.imageUrl}
                      alt={formData.name}
                      className="w-full h-auto"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <p className="font-semibold text-lg">{formData.headline}</p>
                    <p className="text-sm text-muted-foreground mt-1">{formData.description}</p>
                    <Button size="sm" className="mt-3">
                      {formData.callToAction}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-3 border rounded">
                      <p className="text-muted-foreground">Score IA</p>
                      <p className="text-lg font-semibold text-green-600">
                        {generatedCreative.performanceScore || '85'}/100
                      </p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="text-muted-foreground">Type</p>
                      <p className="text-lg font-semibold capitalize">{formData.adType}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">
                  Remplissez le formulaire et cliquez sur "Générer" pour créer votre créatif
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
