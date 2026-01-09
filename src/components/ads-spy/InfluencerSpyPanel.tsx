import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Search, 
  Loader2, 
  ExternalLink, 
  TrendingUp, 
  Heart,
  Eye,
  MessageCircle,
  ShoppingBag,
  Instagram,
  Star,
  Sparkles
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Influencer {
  id: string;
  name: string;
  username: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  avatar: string;
  followers: string;
  engagementRate: number;
  category: string;
  country: string;
  productsPromoted: number;
  avgViews: string;
  estimatedCost: string;
  recentPlacements: {
    product: string;
    brand: string;
    performance: 'high' | 'medium' | 'low';
  }[];
  verified: boolean;
}

const mockInfluencers: Influencer[] = [
  {
    id: '1',
    name: 'Sophie Martin',
    username: '@sophiemartin.beauty',
    platform: 'instagram',
    avatar: '',
    followers: '1.2M',
    engagementRate: 4.5,
    category: 'Beauté',
    country: 'FR',
    productsPromoted: 45,
    avgViews: '150K',
    estimatedCost: '3,000€-5,000€',
    recentPlacements: [
      { product: 'Sérum Vitamine C', brand: 'GlowLab', performance: 'high' },
      { product: 'Palette Yeux', brand: 'BeautyEssentials', performance: 'high' },
    ],
    verified: true,
  },
  {
    id: '2',
    name: 'Lucas Fitness',
    username: '@lucas.fit',
    platform: 'tiktok',
    avatar: '',
    followers: '850K',
    engagementRate: 6.8,
    category: 'Fitness',
    country: 'FR',
    productsPromoted: 32,
    avgViews: '500K',
    estimatedCost: '2,000€-4,000€',
    recentPlacements: [
      { product: 'Shaker Protéines', brand: 'FitGear', performance: 'high' },
      { product: 'Bandes de résistance', brand: 'HomeFit', performance: 'medium' },
    ],
    verified: true,
  },
  {
    id: '3',
    name: 'Emma Tech',
    username: '@emmatech',
    platform: 'youtube',
    avatar: '',
    followers: '450K',
    engagementRate: 3.2,
    category: 'Tech',
    country: 'BE',
    productsPromoted: 28,
    avgViews: '80K',
    estimatedCost: '1,500€-3,000€',
    recentPlacements: [
      { product: 'Écouteurs sans fil', brand: 'SoundMax', performance: 'high' },
      { product: 'Support téléphone', brand: 'TechEssentials', performance: 'low' },
    ],
    verified: false,
  },
];

export function InfluencerSpyPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [platform, setPlatform] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [influencers] = useState<Influencer[]>(mockInfluencers);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 1500);
  };

  const platforms = [
    { value: 'all', label: 'Toutes plateformes' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
  ];

  const categories = [
    { value: 'all', label: 'Toutes niches' },
    { value: 'Beauté', label: 'Beauté' },
    { value: 'Fitness', label: 'Fitness' },
    { value: 'Tech', label: 'Tech' },
    { value: 'Mode', label: 'Mode' },
    { value: 'Gaming', label: 'Gaming' },
    { value: 'Lifestyle', label: 'Lifestyle' },
  ];

  const platformIcons: Record<string, React.ReactNode> = {
    instagram: <Instagram className="w-4 h-4 text-pink-500" />,
    tiktok: <span className="text-sm">🎵</span>,
    youtube: <span className="text-sm">▶️</span>,
  };

  const performanceColors = {
    high: 'bg-green-500/20 text-green-600 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    low: 'bg-red-500/20 text-red-600 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="border-pink-500/20 bg-gradient-to-r from-pink-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-500" />
            Marketing d'Influence
          </CardTitle>
          <CardDescription>
            Découvrez les placements de produits des influenceurs et identifiez les opportunités
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un influenceur, une marque, un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                {showFilters ? 'Masquer les filtres' : 'Filtres avancés'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plateforme</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Niche</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Influencers Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Influenceurs avec placements récents
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {influencers.map((influencer) => (
            <Card key={influencer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={influencer.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                      {influencer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <CardTitle className="text-base">{influencer.name}</CardTitle>
                      {influencer.verified && (
                        <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center rounded-full bg-blue-500">
                          <span className="text-white text-[8px]">✓</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{influencer.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {platformIcons[influencer.platform]}
                      <Badge variant="secondary" className="text-xs">{influencer.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <Users className="w-4 h-4 mx-auto text-blue-600" />
                    <p className="font-medium mt-1">{influencer.followers}</p>
                    <p className="text-muted-foreground">Abonnés</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <Heart className="w-4 h-4 mx-auto text-red-500" />
                    <p className="font-medium mt-1">{influencer.engagementRate}%</p>
                    <p className="text-muted-foreground">Engagement</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <Eye className="w-4 h-4 mx-auto text-purple-600" />
                    <p className="font-medium mt-1">{influencer.avgViews}</p>
                    <p className="text-muted-foreground">Vues moy.</p>
                  </div>
                </div>

                {/* Recent Placements */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Placements récents:</p>
                  <div className="space-y-1.5">
                    {influencer.recentPlacements.slice(0, 2).map((placement, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-3 h-3 text-muted-foreground" />
                          <span>{placement.product}</span>
                          <span className="text-muted-foreground">- {placement.brand}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${performanceColors[placement.performance]}`}>
                          {placement.performance === 'high' ? '🔥 Top' : placement.performance === 'medium' ? '📊 Ok' : '📉 Bas'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coût estimé:</span>
                  <span className="font-medium text-green-600">{influencer.estimatedCost}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="flex-1">
                    <Star className="w-3.5 h-3.5 mr-1.5" />
                    Suivre
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
