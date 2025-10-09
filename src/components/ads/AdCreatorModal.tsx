import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAdsManager } from '@/hooks/useAdsManager';
import { Sparkles, Wand2 } from 'lucide-react';

interface AdCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdCreatorModal({ open, onOpenChange }: AdCreatorModalProps) {
  const { createCampaign, generateAIAd, isCreating, isGenerating } = useAdsManager();
  const [useAI, setUseAI] = useState(false);
  const [enableABTest, setEnableABTest] = useState(false);
  
  const [formData, setFormData] = useState({
    campaignName: '',
    platform: 'facebook',
    campaignType: 'conversion',
    budgetDaily: '',
    budgetTotal: '',
    productName: '',
    productDescription: '',
    productPrice: '',
    targetAudience: {
      age: '18-65',
      interests: '',
      location: ''
    },
    headline: '',
    body: '',
    cta: ''
  });

  const handleGenerateAI = async () => {
    const productData = {
      name: formData.productName,
      description: formData.productDescription,
      price: formData.productPrice,
      currency: 'USD'
    };

    generateAIAd(
      {
        productData,
        platform: formData.platform,
        campaignType: formData.campaignType,
        targetAudience: formData.targetAudience,
        generateVariants: enableABTest
      },
      {
        onSuccess: (data: any) => {
          setFormData(prev => ({
            ...prev,
            headline: data.adCreative.primary.headline,
            body: data.adCreative.primary.body,
            cta: data.adCreative.primary.cta
          }));
        }
      }
    );
  };

  const handleSubmit = () => {
    const campaignData = {
      campaignName: formData.campaignName,
      platform: formData.platform,
      campaignType: formData.campaignType,
      budgetDaily: parseFloat(formData.budgetDaily),
      budgetTotal: parseFloat(formData.budgetTotal),
      targetAudience: formData.targetAudience,
      adCreative: {
        headline: formData.headline,
        body: formData.body,
        cta: formData.cta
      },
      aiGenerated: useAI,
      abTestConfig: enableABTest ? { enabled: true } : {}
    };

    createCampaign(campaignData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          campaignName: '',
          platform: 'facebook',
          campaignType: 'conversion',
          budgetDaily: '',
          budgetTotal: '',
          productName: '',
          productDescription: '',
          productPrice: '',
          targetAudience: { age: '18-65', interests: '', location: '' },
          headline: '',
          body: '',
          cta: ''
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ad Campaign</DialogTitle>
          <DialogDescription>
            Create a new advertising campaign with AI-powered optimization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                placeholder="Summer Sale Campaign"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="instagram">Instagram Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Select
                  value={formData.campaignType}
                  onValueChange={(value) => setFormData({ ...formData, campaignType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">Brand Awareness</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budgetDaily">Daily Budget ($)</Label>
                <Input
                  id="budgetDaily"
                  type="number"
                  value={formData.budgetDaily}
                  onChange={(e) => setFormData({ ...formData, budgetDaily: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="budgetTotal">Total Budget ($)</Label>
                <Input
                  id="budgetTotal"
                  type="number"
                  value={formData.budgetTotal}
                  onChange={(e) => setFormData({ ...formData, budgetTotal: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>
          </div>

          {/* AI Generation */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <Label htmlFor="useAI">Use AI to Generate Ad Content</Label>
              </div>
              <Switch
                id="useAI"
                checked={useAI}
                onCheckedChange={setUseAI}
              />
            </div>

            {useAI && (
              <div className="space-y-4 bg-accent/50 p-4 rounded-lg">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="Premium Wireless Headphones"
                  />
                </div>
                <div>
                  <Label htmlFor="productDescription">Product Description</Label>
                  <Textarea
                    id="productDescription"
                    value={formData.productDescription}
                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                    placeholder="Noise-cancelling wireless headphones with 30-hour battery life..."
                  />
                </div>
                <div>
                  <Label htmlFor="productPrice">Price ($)</Label>
                  <Input
                    id="productPrice"
                    value={formData.productPrice}
                    onChange={(e) => setFormData({ ...formData, productPrice: e.target.value })}
                    placeholder="199.99"
                  />
                </div>
                <Button 
                  onClick={handleGenerateAI} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Generate Ad Content with AI'}
                </Button>
              </div>
            )}
          </div>

          {/* Ad Creative */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Get 50% Off Premium Headphones!"
              />
            </div>
            <div>
              <Label htmlFor="body">Ad Copy</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Experience premium sound quality with our wireless headphones..."
              />
            </div>
            <div>
              <Label htmlFor="cta">Call to Action</Label>
              <Input
                id="cta"
                value={formData.cta}
                onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                placeholder="Shop Now"
              />
            </div>
          </div>

          {/* A/B Testing */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <Label htmlFor="abTest">Enable A/B Testing</Label>
              <p className="text-sm text-muted-foreground">
                Test multiple ad variations automatically
              </p>
            </div>
            <Switch
              id="abTest"
              checked={enableABTest}
              onCheckedChange={setEnableABTest}
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={isCreating} className="flex-1">
              {isCreating ? 'Creating...' : 'Create Campaign'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
