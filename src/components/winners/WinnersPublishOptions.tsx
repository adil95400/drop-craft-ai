import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  ShoppingCart, 
  Store, 
  Globe, 
  Mail, 
  Megaphone,
  Check,
  Loader2,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  DollarSign,
  Tags,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WinnerProduct } from '@/hooks/useRealWinnersAPI';

interface WinnersPublishOptionsProps {
  product: WinnerProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PublishChannel {
  id: string;
  name: string;
  icon: any;
  category: 'social' | 'marketplace' | 'platform' | 'marketing';
  enabled: boolean;
  requiresAuth: boolean;
}

const publishChannels: PublishChannel[] = [
  // Réseaux sociaux
  { id: 'facebook', name: 'Facebook', icon: Facebook, category: 'social', enabled: true, requiresAuth: true },
  { id: 'instagram', name: 'Instagram', icon: Instagram, category: 'social', enabled: true, requiresAuth: true },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, category: 'social', enabled: true, requiresAuth: true },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, category: 'social', enabled: true, requiresAuth: true },
  { id: 'pinterest', name: 'Pinterest', icon: ImageIcon, category: 'social', enabled: true, requiresAuth: true },
  { id: 'tiktok', name: 'TikTok Shop', icon: Target, category: 'social', enabled: true, requiresAuth: true },
  
  // Marketplaces
  { id: 'shopify', name: 'Shopify', icon: ShoppingCart, category: 'marketplace', enabled: true, requiresAuth: true },
  { id: 'amazon', name: 'Amazon', icon: Store, category: 'marketplace', enabled: true, requiresAuth: true },
  { id: 'ebay', name: 'eBay', icon: Store, category: 'marketplace', enabled: true, requiresAuth: true },
  { id: 'etsy', name: 'Etsy', icon: Store, category: 'marketplace', enabled: true, requiresAuth: true },
  { id: 'woocommerce', name: 'WooCommerce', icon: Globe, category: 'marketplace', enabled: true, requiresAuth: true },
  { id: 'prestashop', name: 'PrestaShop', icon: Globe, category: 'marketplace', enabled: true, requiresAuth: true },
  
  // Plateformes publicitaires
  { id: 'google-ads', name: 'Google Ads', icon: Target, category: 'platform', enabled: true, requiresAuth: true },
  { id: 'facebook-ads', name: 'Facebook Ads', icon: Target, category: 'platform', enabled: true, requiresAuth: true },
  { id: 'google-shopping', name: 'Google Shopping', icon: ShoppingCart, category: 'platform', enabled: true, requiresAuth: true },
  
  // Marketing
  { id: 'email', name: 'Email Campaign', icon: Mail, category: 'marketing', enabled: true, requiresAuth: false },
  { id: 'sms', name: 'SMS Campaign', icon: Megaphone, category: 'marketing', enabled: true, requiresAuth: false },
];

export function WinnersPublishOptions({ product, open, onOpenChange }: WinnersPublishOptionsProps) {
  const { toast } = useToast();
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishedChannels, setPublishedChannels] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  if (!product) return null;

  const toggleChannel = (channelId: string) => {
    const newSelected = new Set(selectedChannels);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelectedChannels(newSelected);
  };

  const handlePublish = async () => {
    if (selectedChannels.size === 0) {
      toast({
        title: "Aucune plateforme sélectionnée",
        description: "Veuillez sélectionner au moins une plateforme",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    setPublishProgress(0);

    const channels = Array.from(selectedChannels);
    const progressIncrement = 100 / channels.length;

    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      setPublishedChannels(prev => new Set([...prev, channel]));
      setPublishProgress((i + 1) * progressIncrement);
    }

    setIsPublishing(false);
    
    toast({
      title: "✅ Publication réussie",
      description: `Produit publié sur ${channels.length} plateforme${channels.length > 1 ? 's' : ''}`,
    });

    // Reset after success
    setTimeout(() => {
      setPublishedChannels(new Set());
      setSelectedChannels(new Set());
      setPublishProgress(0);
      onOpenChange(false);
    }, 2000);
  };

  const getCategoryChannels = (category: string) => 
    publishChannels.filter(ch => ch.category === category);

  const generateDefaultMessage = () => {
    return `🔥 Nouveau produit tendance : ${product.title}

✨ Caractéristiques :
- Prix : ${product.currency} ${product.price}
${product.rating ? `- Note : ${product.rating}/5 (${product.reviews || 0} avis)` : ''}

📈 Score tendance : ${product.trending_score}/100
💰 Demande marché : ${product.market_demand}/100

#ecommerce #winning #dropshipping`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Publier le produit
          </DialogTitle>
          <DialogDescription>
            Publiez "{product.title}" sur vos plateformes préférées
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="channels">Plateformes</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="schedule">Planification</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="channels" className="space-y-6">
              {/* Réseaux sociaux */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Réseaux sociaux
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {getCategoryChannels('social').map((channel) => {
                    const Icon = channel.icon;
                    const isSelected = selectedChannels.has(channel.id);
                    const isPublished = publishedChannels.has(channel.id);

                    return (
                      <div
                        key={channel.id}
                        onClick={() => !isPublishing && toggleChannel(channel.id)}
                        className={`
                          relative p-4 border rounded-lg cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} disabled={isPublishing} />
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{channel.name}</span>
                          {isPublished && (
                            <Check className="h-4 w-4 text-success ml-auto" />
                          )}
                        </div>
                        {channel.requiresAuth && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Connexion requise
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Marketplaces */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Marketplaces
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {getCategoryChannels('marketplace').map((channel) => {
                    const Icon = channel.icon;
                    const isSelected = selectedChannels.has(channel.id);
                    const isPublished = publishedChannels.has(channel.id);

                    return (
                      <div
                        key={channel.id}
                        onClick={() => !isPublishing && toggleChannel(channel.id)}
                        className={`
                          relative p-4 border rounded-lg cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} disabled={isPublishing} />
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{channel.name}</span>
                          {isPublished && (
                            <Check className="h-4 w-4 text-success ml-auto" />
                          )}
                        </div>
                        {channel.requiresAuth && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Connexion requise
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plateformes publicitaires */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Publicité
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {getCategoryChannels('platform').map((channel) => {
                    const Icon = channel.icon;
                    const isSelected = selectedChannels.has(channel.id);
                    const isPublished = publishedChannels.has(channel.id);

                    return (
                      <div
                        key={channel.id}
                        onClick={() => !isPublishing && toggleChannel(channel.id)}
                        className={`
                          relative p-4 border rounded-lg cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} disabled={isPublishing} />
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{channel.name}</span>
                          {isPublished && (
                            <Check className="h-4 w-4 text-success ml-auto" />
                          )}
                        </div>
                        {channel.requiresAuth && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Connexion requise
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Marketing */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Marketing
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {getCategoryChannels('marketing').map((channel) => {
                    const Icon = channel.icon;
                    const isSelected = selectedChannels.has(channel.id);
                    const isPublished = publishedChannels.has(channel.id);

                    return (
                      <div
                        key={channel.id}
                        onClick={() => !isPublishing && toggleChannel(channel.id)}
                        className={`
                          relative p-4 border rounded-lg cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} disabled={isPublishing} />
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{channel.name}</span>
                          {isPublished && (
                            <Check className="h-4 w-4 text-success ml-auto" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label>Message personnalisé</Label>
                <Textarea
                  placeholder={generateDefaultMessage()}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[200px] mt-2"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setCustomMessage(generateDefaultMessage())}
                >
                  Générer message par défaut
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Aperçu du produit</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Titre :</strong> {product.title}</p>
                  <p><strong>Prix :</strong> {product.currency} {product.price}</p>
                  <p><strong>Score tendance :</strong> {product.trending_score}/100</p>
                  <p><strong>Demande marché :</strong> {product.market_demand}/100</p>
                  <p><strong>Source :</strong> {product.source}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div>
                <Label>Planifier la publication</Label>
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Laissez vide pour publier immédiatement
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Options de planification
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="auto-optimize" />
                    <Label htmlFor="auto-optimize">Optimiser les heures de publication</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="repeat" />
                    <Label htmlFor="repeat">Répéter la publication</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {isPublishing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Publication en cours...</span>
              <span>{Math.round(publishProgress)}%</span>
            </div>
            <Progress value={publishProgress} />
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedChannels.size} plateforme{selectedChannels.size > 1 ? 's' : ''} sélectionnée{selectedChannels.size > 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPublishing}
            >
              Annuler
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || selectedChannels.size === 0}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Publier maintenant
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
