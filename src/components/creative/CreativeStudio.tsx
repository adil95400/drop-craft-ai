import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Palette, 
  Wand2, 
  Sparkles, 
  Image, 
  Video, 
  Mail, 
  Share2, 
  BarChart3,
  Plus,
  Download,
  Heart,
  Star
} from 'lucide-react'
import { CreativeStudioService, CreativeAsset, MarketingCampaign, DesignTemplate } from '@/services/CreativeStudioService'
import { useToast } from '@/hooks/use-toast'

export function CreativeStudio() {
  const { toast } = useToast()
  const [creativeAssets, setCreativeAssets] = useState<CreativeAsset[]>([])
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [templates, setTemplates] = useState<DesignTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('assets')

  // AI Generation Form State
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedType, setSelectedType] = useState<CreativeAsset['type']>('banner')
  const [isGenerating, setIsGenerating] = useState(false)

  // New Campaign Form State
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'social' as MarketingCampaign['type'],
    budget: '',
    target_audience: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [assetsData, campaignsData, templatesData] = await Promise.all([
        CreativeStudioService.getInstance().getCreativeAssets(),
        CreativeStudioService.getInstance().getMarketingCampaigns(),
        CreativeStudioService.getInstance().getDesignTemplates()
      ])
      
      setCreativeAssets(assetsData)
      setCampaigns(campaignsData)
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error loading creative studio data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du studio créatif",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description pour générer le contenu",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await CreativeStudioService.getInstance().generateWithAI(aiPrompt, selectedType)
      
      if (result.success) {
        // Create new asset
        const newAsset = await CreativeStudioService.getInstance().createAsset({
          name: `AI Generated ${selectedType}`,
          type: selectedType,
          url: result.asset_url || '/api/placeholder/400/400',
          brand_colors: ['#3B82F6', '#EF4444']
        })
        
        setCreativeAssets(prev => [newAsset, ...prev])
        setAiPrompt('')
        
        toast({
          title: "Succès",
          description: "Contenu créatif généré avec succès",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error generating with AI:', error)
      toast({
        title: "Erreur",
        description: "Impossible de générer le contenu avec l'IA",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom pour la campagne",
        variant: "destructive",
      })
      return
    }

    try {
      const campaign = await CreativeStudioService.getInstance().createCampaign({
        name: newCampaign.name,
        type: newCampaign.type,
        status: 'draft',
        budget: newCampaign.budget ? parseFloat(newCampaign.budget) : undefined,
        target_audience: newCampaign.target_audience || undefined
      })
      
      setCampaigns(prev => [campaign, ...prev])
      setNewCampaign({ name: '', type: 'social', budget: '', target_audience: '' })
      
      toast({
        title: "Succès",
        description: "Nouvelle campagne créée avec succès",
      })
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la campagne",
        variant: "destructive",
      })
    }
  }

  const getAssetIcon = (type: CreativeAsset['type']) => {
    switch (type) {
      case 'banner': return <Image className="h-4 w-4" />
      case 'social_post': return <Share2 className="h-4 w-4" />
      case 'product_image': return <Image className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'email_template': return <Mail className="h-4 w-4" />
      default: return <Image className="h-4 w-4" />
    }
  }

  const getCampaignStatusColor = (status: MarketingCampaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Studio Créatif</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos contenus marketing avec l'IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            IA Activée
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assets">
            <Image className="h-4 w-4 mr-2" />
            Assets Créatifs
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <BarChart3 className="h-4 w-4 mr-2" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Palette className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="ai-generator">
            <Wand2 className="h-4 w-4 mr-2" />
            Générateur IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creativeAssets.map((asset) => (
              <Card key={asset.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                    {getAssetIcon(asset.type)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{asset.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {asset.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {asset.brand_colors && (
                    <div className="flex gap-1 mt-2">
                      {asset.brand_colors.map((color, idx) => (
                        <div 
                          key={idx} 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle Campagne</CardTitle>
              <CardDescription>
                Créez une nouvelle campagne marketing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-name">Nom de la campagne</Label>
                  <Input
                    id="campaign-name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Promotion Black Friday"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-type">Type</Label>
                  <Select 
                    value={newCampaign.type} 
                    onValueChange={(value: MarketingCampaign['type']) => 
                      setNewCampaign(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Réseaux Sociaux</SelectItem>
                      <SelectItem value="email">Email Marketing</SelectItem>
                      <SelectItem value="ads">Publicités</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="campaign-budget">Budget (€)</Label>
                  <Input
                    id="campaign-budget"
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-audience">Audience Cible</Label>
                  <Input
                    id="campaign-audience"
                    value={newCampaign.target_audience}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, target_audience: e.target.value }))}
                    placeholder="Ex: Hommes 25-45 ans"
                  />
                </div>
              </div>
              <Button onClick={handleCreateCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                Créer la Campagne
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>{campaign.type}</CardDescription>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getCampaignStatusColor(campaign.status)}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget:</span>
                      <span>{campaign.budget ? `${campaign.budget}€` : 'Non défini'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Statut:</span>
                      <Badge variant="outline">{campaign.status}</Badge>
                    </div>
                    {campaign.performance_metrics?.roi && (
                      <div className="flex justify-between text-sm">
                        <span>ROI:</span>
                        <span className="text-green-600 font-semibold">
                          {(campaign.performance_metrics.roi * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <Palette className="h-8 w-8 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    {template.is_premium && (
                      <Badge variant="default" className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <Button className="w-full mt-3" variant="outline">
                    Utiliser ce Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Générateur de Contenu IA
              </CardTitle>
              <CardDescription>
                Décrivez ce que vous voulez créer et laissez l'IA faire le travail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">Description du contenu</Label>
                <Input
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Une bannière moderne pour une vente flash avec des couleurs vives"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="asset-type">Type de contenu</Label>
                <Select 
                  value={selectedType} 
                  onValueChange={(value: CreativeAsset['type']) => setSelectedType(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Bannière</SelectItem>
                    <SelectItem value="social_post">Post Réseaux Sociaux</SelectItem>
                    <SelectItem value="product_image">Image Produit</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                    <SelectItem value="email_template">Template Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAIGeneration} 
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Générer avec l'IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}