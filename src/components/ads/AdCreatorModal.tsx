import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAdsManagerNew } from '@/hooks/useAdsManagerNew';
import { Sparkles, Wand2 } from 'lucide-react';

interface AdCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdCreatorModal({ open, onOpenChange }: AdCreatorModalProps) {
  const { createCampaign, generateCreative, isCreatingCampaign, isGeneratingCreative } = useAdsManagerNew();
  const [useAI, setUseAI] = useState(false);
  const [enableABTest, setEnableABTest] = useState(false);
  const [generateVisuals, setGenerateVisuals] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
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
      productName: formData.productName,
      productDescription: formData.productDescription,
      productPrice: formData.productPrice,
      platform: formData.platform,
      objective: formData.campaignType,
      targetAudience: formData.targetAudience.interests,
      generateVisuals
    };

    try {
      const result = await generateCreative(productData);
      if (result?.creative) {
        setFormData(prev => ({
          ...prev,
          headline: result.creative.headline || prev.headline,
          body: result.creative.description || prev.body,
          cta: result.creative.callToAction || prev.cta
        }));
        if (result.creative.imageUrl) {
          setGeneratedImageUrl(result.creative.imageUrl);
        }
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
    }
  };

  const handleSubmit = () => {
    createCampaign({
      name: formData.campaignName,
      platform: formData.platform,
      objective: formData.campaignType,
      budgetType: 'daily',
      budgetAmount: parseFloat(formData.budgetDaily),
      targetAudience: formData.targetAudience.interests,
      aiOptimizationEnabled: useAI
    });
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
                
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="generateVisuals">Generate Visuals with AI</Label>
                    <p className="text-xs text-muted-foreground">
                      Create ad images automatically
                    </p>
                  </div>
                  <Switch
                    id="generateVisuals"
                    checked={generateVisuals}
                    onCheckedChange={setGenerateVisuals}
                  />
                </div>

                {generatedImageUrl && (
                  <div className="border rounded-lg p-4 bg-background">
                    <Label className="mb-2 block">Generated Visual Preview</Label>
                    <img 
                      src={generatedImageUrl} 
                      alt="AI Generated Ad Visual" 
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleGenerateAI} 
                  disabled={isGeneratingCreative}
                  className="w-full"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isGeneratingCreative ? 'Generating...' : 
                    generateVisuals ? 'Generate Complete Ad with AI (Text + Visuals)' : 'Generate Ad Content with AI'}
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
            <Button onClick={handleSubmit} disabled={isCreatingCampaign} className="flex-1">
              {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
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
