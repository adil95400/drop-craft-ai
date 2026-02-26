import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Send, 
  ShoppingCart, 
  TrendingUp,
  Mail,
  MessageSquare,
  Calendar as CalendarIcon,
  CheckCircle,
  Loader2,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ImportedProduct } from '@/types/import';

interface ImportPublishOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  product: ImportedProduct;
}

interface PublishChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'social' | 'marketplace' | 'ads' | 'marketing';
  connected: boolean;
}

export const ImportPublishOptions: React.FC<ImportPublishOptionsProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const { toast } = useToast();
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishedChannels, setPublishedChannels] = useState<string[]>([]);

  const channels: PublishChannel[] = [
    // Réseaux sociaux
    { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-4 h-4" />, category: 'social', connected: true },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-4 h-4" />, category: 'social', connected: true },
    { id: 'twitter', name: 'Twitter/X', icon: <Twitter className="w-4 h-4" />, category: 'social', connected: true },
    { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, category: 'social', connected: true },
    { id: 'pinterest', name: 'Pinterest', icon: <Share2 className="w-4 h-4" />, category: 'social', connected: true },
    { id: 'tiktok', name: 'TikTok', icon: <Share2 className="w-4 h-4" />, category: 'social', connected: true },
    
    // Marketplaces
    { id: 'shopify', name: 'Shopify', icon: <ShoppingCart className="w-4 h-4" />, category: 'marketplace', connected: true },
    { id: 'amazon', name: 'Amazon', icon: <ShoppingCart className="w-4 h-4" />, category: 'marketplace', connected: true },
    { id: 'ebay', name: 'eBay', icon: <ShoppingCart className="w-4 h-4" />, category: 'marketplace', connected: true },
    { id: 'etsy', name: 'Etsy', icon: <ShoppingCart className="w-4 h-4" />, category: 'marketplace', connected: true },
    { id: 'woocommerce', name: 'WooCommerce', icon: <ShoppingCart className="w-4 h-4" />, category: 'marketplace', connected: true },
    { id: 'prestashop', name: 'PrestaShop', icon: <ShoppingCart className="w-4 h-4" />, category: 'marketplace', connected: true },
    
    // Publicité
    { id: 'google-ads', name: 'Google Ads', icon: <TrendingUp className="w-4 h-4" />, category: 'ads', connected: true },
    { id: 'facebook-ads', name: 'Facebook Ads', icon: <TrendingUp className="w-4 h-4" />, category: 'ads', connected: true },
    { id: 'google-shopping', name: 'Google Shopping', icon: <TrendingUp className="w-4 h-4" />, category: 'ads', connected: true },
    
    // Marketing
    { id: 'email', name: 'Email Marketing', icon: <Mail className="w-4 h-4" />, category: 'marketing', connected: true },
    { id: 'sms', name: 'SMS Marketing', icon: <MessageSquare className="w-4 h-4" />, category: 'marketing', connected: true }
  ];

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handlePublish = async () => {
    if (selectedChannels.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un canal de publication",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    setPublishProgress(0);
    setPublishedChannels([]);

    try {
      const totalChannels = selectedChannels.length;
      
      for (let i = 0; i < selectedChannels.length; i++) {
        const channelId = selectedChannels[i];
        const channel = channels.find(c => c.id === channelId);
        
        // Simuler la publication
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setPublishedChannels(prev => [...prev, channelId]);
        setPublishProgress(((i + 1) / totalChannels) * 100);
        
        toast({
          title: `Publié sur ${channel?.name}`,
          description: `Le produit "${product.name}" a été publié avec succès`
        });
      }

      toast({
        title: "Publication réussie",
        description: `Le produit a été publié sur ${selectedChannels.length} canal(aux)`
      });

      setTimeout(() => {
        onClose();
        setIsPublishing(false);
        setPublishProgress(0);
        setPublishedChannels([]);
        setSelectedChannels([]);
        setCustomMessage('');
        setScheduleDate(undefined);
      }, 1000);
    } catch (error) {
      toast({
        title: "Erreur de publication",
        description: "Une erreur est survenue lors de la publication",
        variant: "destructive"
      });
      setIsPublishing(false);
    }
  };

  const generateDefaultMessage = () => {
    return `🎯 Nouveau produit : ${product.name}\n\n💰 Prix : ${product.price} ${product.currency}\n\n📦 ${product.description || 'Découvrez ce produit incroyable !'}\n\n✨ Catégorie : ${product.category || 'Non spécifié'}`;
  };

  const getCategoryChannels = (category: string) => {
    return channels.filter(c => c.category === category);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publier le produit - {product.name}</DialogTitle>
          <DialogDescription>
            Sélectionnez les canaux sur lesquels vous souhaitez publier ce produit
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="channels">Canaux</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="schedule">Planification</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4">
            {/* Réseaux Sociaux */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Réseaux Sociaux
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getCategoryChannels('social').map(channel => (
                  <div
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedChannels.includes(channel.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                      ${isPublishing ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {channel.icon}
                        <span className="font-medium text-sm">{channel.name}</span>
                      </div>
                      {publishedChannels.includes(channel.id) && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {selectedChannels.includes(channel.id) && !publishedChannels.includes(channel.id) && (
                      <Badge variant="secondary" className="text-xs">Sélectionné</Badge>
                    )}
                    {publishedChannels.includes(channel.id) && (
                      <Badge className="text-xs bg-green-500">Publié</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Marketplaces */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Marketplaces
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getCategoryChannels('marketplace').map(channel => (
                  <div
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedChannels.includes(channel.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                      ${isPublishing ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {channel.icon}
                        <span className="font-medium text-sm">{channel.name}</span>
                      </div>
                      {publishedChannels.includes(channel.id) && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {selectedChannels.includes(channel.id) && !publishedChannels.includes(channel.id) && (
                      <Badge variant="secondary" className="text-xs">Sélectionné</Badge>
                    )}
                    {publishedChannels.includes(channel.id) && (
                      <Badge className="text-xs bg-green-500">Publié</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Publicité */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Plateformes Publicitaires
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getCategoryChannels('ads').map(channel => (
                  <div
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedChannels.includes(channel.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                      ${isPublishing ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {channel.icon}
                        <span className="font-medium text-sm">{channel.name}</span>
                      </div>
                      {publishedChannels.includes(channel.id) && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {selectedChannels.includes(channel.id) && !publishedChannels.includes(channel.id) && (
                      <Badge variant="secondary" className="text-xs">Sélectionné</Badge>
                    )}
                    {publishedChannels.includes(channel.id) && (
                      <Badge className="text-xs bg-green-500">Publié</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Marketing */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Marketing
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getCategoryChannels('marketing').map(channel => (
                  <div
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedChannels.includes(channel.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                      ${isPublishing ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {channel.icon}
                        <span className="font-medium text-sm">{channel.name}</span>
                      </div>
                      {publishedChannels.includes(channel.id) && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {selectedChannels.includes(channel.id) && !publishedChannels.includes(channel.id) && (
                      <Badge variant="secondary" className="text-xs">Sélectionné</Badge>
                    )}
                    {publishedChannels.includes(channel.id) && (
                      <Badge className="text-xs bg-green-500">Publié</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div>
              <Label htmlFor="message">Message personnalisé</Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={generateDefaultMessage()}
                className="min-h-[200px]"
                disabled={isPublishing}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomMessage(generateDefaultMessage())}
                className="mt-2"
                disabled={isPublishing}
              >
                Utiliser le message par défaut
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Aperçu du produit</h4>
              <div className="flex gap-4">
                {product.image_urls?.[0] && (
                  <img
                    src={product.image_urls[0]}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div>
                  <h5 className="font-medium">{product.name}</h5>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                  <p className="text-lg font-bold mt-2">
                    {product.price} {product.currency}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={!!scheduleDate}
                  onCheckedChange={(checked) => {
                    if (!checked) setScheduleDate(undefined);
                  }}
                  disabled={isPublishing}
                />
                <Label htmlFor="schedule">Planifier la publication</Label>
              </div>

              {scheduleDate !== undefined && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={isPublishing}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduleDate ? format(scheduleDate, 'PPP', { locale: getDateFnsLocale() }) : 'Choisir une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={setScheduleDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  {scheduleDate
                    ? `La publication sera effectuée le ${format(scheduleDate, 'PPP', { locale: getDateFnsLocale() })}`
                    : 'La publication sera effectuée immédiatement'}
                </p>
              </div>
            </div>
          </TabsContent>
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

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedChannels.length} canal(aux) sélectionné(s)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPublishing}>
              Annuler
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing || selectedChannels.length === 0}>
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publier
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
