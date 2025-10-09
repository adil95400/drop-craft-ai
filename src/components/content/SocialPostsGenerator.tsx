import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentGeneration } from '@/hooks/useContentGeneration';
import { Share2, Loader2, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

export function SocialPostsGenerator() {
  const { generateSocialPosts, isGeneratingSocialPosts, socialPostsData } = useContentGeneration();
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    productPrice: '',
    tone: 'professional',
    includeHashtags: true,
    generateImages: true
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'facebook', name: 'Facebook', icon: Facebook },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
    { id: 'tiktok', name: 'TikTok', icon: Share2 }
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleGenerate = () => {
    generateSocialPosts({
      productData: {
        name: formData.productName,
        description: formData.productDescription,
        price: formData.productPrice
      },
      platforms: selectedPlatforms,
      tone: formData.tone,
      includeHashtags: formData.includeHashtags,
      generateImages: formData.generateImages
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Share2 className="h-6 w-6 text-primary" />
          Créateur de Posts Sociaux
        </h2>
        <p className="text-muted-foreground mt-1">
          Générez des posts optimisés pour chaque plateforme
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="productName">Nom du Produit</Label>
          <Input
            id="productName"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="Casque Sans Fil Premium"
          />
        </div>

        <div>
          <Label htmlFor="productDescription">Description</Label>
          <Textarea
            id="productDescription"
            value={formData.productDescription}
            onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
            placeholder="Réduction de bruit active, 30h d'autonomie..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="productPrice">Prix</Label>
            <Input
              id="productPrice"
              value={formData.productPrice}
              onChange={(e) => setFormData({ ...formData, productPrice: e.target.value })}
              placeholder="199.99 €"
            />
          </div>

          <div>
            <Label htmlFor="tone">Ton</Label>
            <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="casual">Décontracté</SelectItem>
                <SelectItem value="enthusiastic">Enthousiaste</SelectItem>
                <SelectItem value="luxury">Luxe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Plateformes</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platforms.map(platform => {
              const Icon = platform.icon;
              return (
                <div
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                  />
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="includeHashtags"
              checked={formData.includeHashtags}
              onCheckedChange={(checked) => setFormData({ ...formData, includeHashtags: checked as boolean })}
            />
            <Label htmlFor="includeHashtags">Inclure hashtags</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="generateImages"
              checked={formData.generateImages}
              onCheckedChange={(checked) => setFormData({ ...formData, generateImages: checked as boolean })}
            />
            <Label htmlFor="generateImages">Générer images</Label>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGeneratingSocialPosts || selectedPlatforms.length === 0} size="lg">
          {isGeneratingSocialPosts ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Générer Posts ({selectedPlatforms.length} plateformes)
            </>
          )}
        </Button>
      </div>

      {socialPostsData?.posts && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Posts Générés</h3>
          {socialPostsData.posts.map((post: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold capitalize">
                {post.platform}
                <span className="text-xs text-muted-foreground">
                  (Meilleur moment: {post.bestTimeToPost})
                </span>
              </div>
              
              {post.image && (
                <img src={post.image} alt={`${post.platform} post`} className="w-full max-w-md rounded-lg" />
              )}
              
              <div className="space-y-2">
                <p className="text-sm whitespace-pre-wrap">{post.content.caption}</p>
                {post.content.hashtags && post.content.hashtags.length > 0 && (
                  <p className="text-sm text-primary">
                    {post.content.hashtags.join(' ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Potentiel viral: {post.engagement.viralPotential}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
