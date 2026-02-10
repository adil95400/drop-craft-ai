import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Link2, 
  Star,
  Eye,
  ShoppingCart,
  Gift,
  MessageSquare,
  ExternalLink,
  Copy,
  Share
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

interface Affiliate {
  id: string
  name: string
  email: string
  avatar?: string
  joinDate: string
  status: 'active' | 'pending' | 'suspended'
  totalCommissions: number
  totalSales: number
  clicksGenerated: number
  conversionRate: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  referralCode: string
}

interface Influencer {
  id: string
  name: string
  handle: string
  platform: 'instagram' | 'youtube' | 'tiktok' | 'twitter'
  followers: number
  engagement: number
  niche: string
  rating: number
  priceRange: string
  status: 'available' | 'busy' | 'unavailable'
  avatar?: string
  description: string
}

interface Commission {
  id: string
  affiliateId: string
  affiliateName: string
  productName: string
  saleAmount: number
  commissionAmount: number
  rate: number
  date: string
  status: 'pending' | 'approved' | 'paid'
}

const AffiliationPage = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data
  const affiliates: Affiliate[] = [
    {
      id: 'aff-001',
      name: 'Sophie Dupont',
      email: 'sophie.dupont@email.com',
      joinDate: '2024-01-10',
      status: 'active',
      totalCommissions: 1247.50,
      totalSales: 12475,
      clicksGenerated: 2847,
      conversionRate: 4.3,
      tier: 'gold',
      referralCode: 'SOPHIE2024'
    },
    {
      id: 'aff-002',
      name: 'Marc Martin',
      email: 'marc.martin@email.com',
      joinDate: '2024-01-15',
      status: 'active',
      totalCommissions: 890.25,
      totalSales: 8902.50,
      clicksGenerated: 1923,
      conversionRate: 3.8,
      tier: 'silver',
      referralCode: 'MARC2024'
    },
    {
      id: 'aff-003',
      name: 'Julie Moreau',
      email: 'julie.moreau@email.com',
      joinDate: '2024-01-20',
      status: 'pending',
      totalCommissions: 0,
      totalSales: 0,
      clicksGenerated: 0,
      conversionRate: 0,
      tier: 'bronze',
      referralCode: 'JULIE2024'
    }
  ]

  const influencers: Influencer[] = [
    {
      id: 'inf-001',
      name: 'Emma Lifestyle',
      handle: '@emmalifestyle',
      platform: 'instagram',
      followers: 125000,
      engagement: 4.2,
      niche: 'Lifestyle & Déco',
      rating: 4.8,
      priceRange: '500-1000€',
      status: 'available',
      description: 'Spécialisée dans la décoration d\'intérieur et le lifestyle. Audience engagée et authentique.'
    },
    {
      id: 'inf-002',
      name: 'Tech Review Pro',
      handle: '@techreviewpro',
      platform: 'youtube',
      followers: 89000,
      engagement: 6.8,
      niche: 'Technologie & Gadgets',
      rating: 4.9,
      priceRange: '800-1500€',
      status: 'busy',
      description: 'Reviews de produits tech avec une approche très professionnelle et des tests approfondis.'
    },
    {
      id: 'inf-003',
      name: 'Maison & Style',
      handle: '@maisonstyle',
      platform: 'tiktok',
      followers: 67000,
      engagement: 8.1,
      niche: 'Maison & Jardin',
      rating: 4.6,
      priceRange: '300-700€',
      status: 'available',
      description: 'Créatrice de contenu maison avec des vidéos créatives et inspirantes.'
    }
  ]

  const commissions: Commission[] = [
    {
      id: 'com-001',
      affiliateId: 'aff-001',
      affiliateName: 'Sophie Dupont',
      productName: 'Chaise de bureau ergonomique',
      saleAmount: 299.99,
      commissionAmount: 30.00,
      rate: 10,
      date: '2024-01-19',
      status: 'approved'
    },
    {
      id: 'com-002',
      affiliateId: 'aff-002',
      affiliateName: 'Marc Martin',
      productName: 'Table basse moderne',
      saleAmount: 189.50,
      commissionAmount: 18.95,
      rate: 10,
      date: '2024-01-18',
      status: 'pending'
    }
  ]

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'platinum': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'available': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended':
      case 'busy': return 'bg-red-100 text-red-800'
      case 'unavailable': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return '📷'
      case 'youtube': return '📹'
      case 'tiktok': return '🎵'
      case 'twitter': return '🐦'
      default: return '📱'
    }
  }

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const handleCopyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code copié",
      description: `Le code de parrainage ${code} a été copié dans le presse-papiers`,
    })
  }

  const handleContactInfluencer = (influencer: Influencer) => {
    toast({
      title: "Contact en cours",
      description: `Ouverture de la discussion avec ${influencer.name}`,
    })
  }

  const totalAffiliates = affiliates.length
  const activeAffiliates = affiliates.filter(a => a.status === 'active').length
  const totalCommissions = affiliates.reduce((sum, a) => sum + a.totalCommissions, 0)
  const totalSales = affiliates.reduce((sum, a) => sum + a.totalSales, 0)

  return (
    <ChannablePageWrapper
      title="Affiliation & Influenceurs"
      description="Programme d'affiliation et marketplace d'influenceurs"
      heroImage="marketing"
      badge={{ label: 'Affiliation', icon: Users }}
      actions={
        <>
          <Button variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Partager le programme
          </Button>
          <Button>
            <Users className="mr-2 h-4 w-4" />
            Recruter des affiliés
          </Button>
        </>
      }
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliés actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAffiliates}</div>
            <p className="text-xs text-muted-foreground">+{totalAffiliates - activeAffiliates} en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions versées</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes générées</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+18% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.1%</div>
            <p className="text-xs text-muted-foreground">+0.3% vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliés</TabsTrigger>
          <TabsTrigger value="influencers">Marketplace Influenceurs</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Affiliés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliates.slice(0, 3).map((affiliate) => (
                    <div key={affiliate.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={affiliate.avatar} />
                          <AvatarFallback>{affiliate.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{affiliate.name}</p>
                          <p className="text-sm text-muted-foreground">
                            <Badge className={getTierColor(affiliate.tier)}>{affiliate.tier}</Badge>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">€{affiliate.totalCommissions.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.conversionRate}% conv.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Influenceurs disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {influencers.filter(i => i.status === 'available').slice(0, 3).map((influencer) => (
                    <div key={influencer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={influencer.avatar} />
                          <AvatarFallback>{influencer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{influencer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getPlatformIcon(influencer.platform)} {formatFollowers(influencer.followers)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{influencer.rating}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{influencer.priceRange}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Rechercher un affilié..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Inviter un affilié
            </Button>
          </div>

          <div className="space-y-4">
            {affiliates.map((affiliate) => (
              <Card key={affiliate.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={affiliate.avatar} />
                        <AvatarFallback>{affiliate.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{affiliate.name}</CardTitle>
                        <CardDescription>{affiliate.email}</CardDescription>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getTierColor(affiliate.tier)}>{affiliate.tier}</Badge>
                          <Badge className={getStatusColor(affiliate.status)}>{affiliate.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rejoint le {affiliate.joinDate}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Commissions</p>
                      <p className="text-lg font-bold">€{affiliate.totalCommissions.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ventes générées</p>
                      <p className="text-lg font-bold">€{affiliate.totalSales.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clics</p>
                      <p className="text-lg font-bold">{affiliate.clicksGenerated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion</p>
                      <p className="text-lg font-bold">{affiliate.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Code de parrainage</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{affiliate.referralCode}</code>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleCopyReferralCode(affiliate.referralCode)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contacter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Voir les performances
                    </Button>
                    <Button variant="outline" size="sm">
                      <Link2 className="mr-2 h-4 w-4" />
                      Liens de parrainage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="influencers" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Input
                placeholder="Rechercher un influenceur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par plateforme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les plateformes</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Rechercher des influenceurs
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {influencers.map((influencer) => (
              <Card key={influencer.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={influencer.avatar} />
                        <AvatarFallback>{influencer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{influencer.name}</CardTitle>
                        <CardDescription>{influencer.handle}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(influencer.status)}>{influencer.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{getPlatformIcon(influencer.platform)}</span>
                    <div className="text-right">
                      <p className="font-bold">{formatFollowers(influencer.followers)}</p>
                      <p className="text-sm text-muted-foreground">followers</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Engagement</span>
                      <span className="text-sm font-medium">{influencer.engagement}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Niche</span>
                      <span className="text-sm font-medium">{influencer.niche}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tarif</span>
                      <span className="text-sm font-medium">{influencer.priceRange}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{influencer.rating}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{influencer.description}</p>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleContactInfluencer(influencer)}
                      disabled={influencer.status !== 'available'}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contacter
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      Profil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <div className="space-y-4">
            {commissions.map((commission) => (
              <Card key={commission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{commission.productName}</CardTitle>
                      <CardDescription>Par {commission.affiliateName} • {commission.date}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(commission.status)}>{commission.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Montant de la vente</p>
                      <p className="text-lg font-bold">€{commission.saleAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="text-lg font-bold text-green-600">€{commission.commissionAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taux</p>
                      <p className="text-lg font-bold">{commission.rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ID Commission</p>
                      <p className="text-sm font-mono">{commission.id}</p>
                    </div>
                  </div>
                  {commission.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm">Approuver</Button>
                      <Button size="sm" variant="outline">Rejeter</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du programme d'affiliation</CardTitle>
              <CardDescription>Paramètres généraux de votre programme d'affiliation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Taux de commission par défaut (%)</Label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div>
                  <Label>Commission minimum pour paiement (€)</Label>
                  <Input type="number" defaultValue="50" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Taux par tier</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Bronze (%)</Label>
                    <Input type="number" defaultValue="8" />
                  </div>
                  <div>
                    <Label>Silver (%)</Label>
                    <Input type="number" defaultValue="10" />
                  </div>
                  <div>
                    <Label>Gold (%)</Label>
                    <Input type="number" defaultValue="12" />
                  </div>
                  <div>
                    <Label>Platinum (%)</Label>
                    <Input type="number" defaultValue="15" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Approbation automatique des nouveaux affiliés</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Notification par email des nouvelles commissions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Permettre aux affiliés de voir leurs statistiques en temps réel</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Conditions d'utilisation du programme</Label>
                <Textarea 
                  placeholder="Décrivez les conditions d'utilisation de votre programme d'affiliation..."
                  className="mt-2"
                />
              </div>

              <Button>
                <Gift className="mr-2 h-4 w-4" />
                Sauvegarder la configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}

export default AffiliationPage