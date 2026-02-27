import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Share2, Image, Video, Calendar, CheckCircle2,
  Clock, Plus, Eye, Heart, MessageSquare, ArrowUpRight, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  followers?: number;
  postsThisMonth?: number;
  engagement?: number;
  status: 'active' | 'inactive';
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', connected: false, status: 'inactive' },
  { id: 'facebook', name: 'Facebook', icon: '👤', connected: false, status: 'inactive' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: false, status: 'inactive' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: false, status: 'inactive' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', connected: false, status: 'inactive' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', connected: false, status: 'inactive' },
];

const DEMO_POSTS = [
  { id: '1', platform: 'instagram', title: 'Nouveauté: Casque Bluetooth Pro', type: 'image', status: 'published', reach: 4500, likes: 234, comments: 18, date: '2026-02-26' },
  { id: '2', platform: 'facebook', title: 'Soldes flash -30% sur tout', type: 'carousel', status: 'published', reach: 8200, likes: 456, comments: 32, date: '2026-02-25' },
  { id: '3', platform: 'tiktok', title: 'Unboxing du mois', type: 'video', status: 'scheduled', reach: 0, likes: 0, comments: 0, date: '2026-02-28' },
  { id: '4', platform: 'pinterest', title: 'Collection Printemps 2026', type: 'image', status: 'draft', reach: 0, likes: 0, comments: 0, date: '2026-03-01' },
];

export function SocialMediaTab() {
  const [platforms, setPlatforms] = useState(SOCIAL_PLATFORMS);

  const toggleConnect = (id: string) => {
    setPlatforms(ps => ps.map(p =>
      p.id === id ? {
        ...p,
        connected: !p.connected,
        status: p.connected ? 'inactive' as const : 'active' as const,
        followers: p.connected ? undefined : Math.floor(Math.random() * 50000) + 1000,
        postsThisMonth: p.connected ? undefined : Math.floor(Math.random() * 15) + 2,
        engagement: p.connected ? undefined : parseFloat((Math.random() * 5 + 1).toFixed(1)),
      } : p
    ));
  };

  const connectedCount = platforms.filter(p => p.connected).length;
  const totalFollowers = platforms.reduce((a, p) => a + (p.followers || 0), 0);
  const avgEngagement = platforms.filter(p => p.engagement).length > 0
    ? (platforms.reduce((a, p) => a + (p.engagement || 0), 0) / platforms.filter(p => p.engagement).length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réseaux connectés</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
              <Share2 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Followers totaux</p>
                <p className="text-2xl font-bold">{totalFollowers > 0 ? (totalFollowers / 1000).toFixed(1) + 'K' : '0'}</p>
              </div>
              <Eye className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement moy.</p>
                <p className="text-2xl font-bold">{avgEngagement}%</p>
              </div>
              <Heart className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posts ce mois</p>
                <p className="text-2xl font-bold">{platforms.reduce((a, p) => a + (p.postsThisMonth || 0), 0)}</p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Réseaux sociaux
          </CardTitle>
          <CardDescription>Publiez vos produits et promotions automatiquement sur vos réseaux</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map(platform => (
              <div key={platform.id} className={cn(
                "p-4 rounded-xl border transition-all",
                platform.connected ? "border-primary/40 bg-primary/[0.03]" : "border-border hover:border-muted-foreground/30"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{platform.name}</p>
                      {platform.connected && (
                        <p className="text-xs text-muted-foreground">
                          {(platform.followers! / 1000).toFixed(1)}K followers · {platform.engagement}% eng.
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch checked={platform.connected} onCheckedChange={() => toggleConnect(platform.id)} />
                </div>
                {platform.connected && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[10px]">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                      Connecté
                    </Badge>
                    <span className="text-xs text-muted-foreground">{platform.postsThisMonth} posts ce mois</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Publications récentes
              </CardTitle>
              <CardDescription>Planifiez et suivez vos publications produits</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nouvelle publication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_POSTS.map(post => {
              const platformInfo = SOCIAL_PLATFORMS.find(p => p.id === post.platform);
              return (
                <div key={post.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/60 hover:border-primary/30 transition-colors">
                  <span className="text-xl shrink-0">{platformInfo?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{post.title}</p>
                      <Badge variant={post.type === 'video' ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
                        {post.type === 'video' ? <Video className="h-2.5 w-2.5 mr-1" /> : <Image className="h-2.5 w-2.5 mr-1" />}
                        {post.type}
                      </Badge>
                      <Badge variant={post.status === 'published' ? 'default' : post.status === 'scheduled' ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
                        {post.status === 'published' ? 'Publié' : post.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
                      </Badge>
                    </div>
                    {post.status === 'published' && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.reach.toLocaleString('fr-FR')}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{post.comments}</span>
                      </div>
                    )}
                    {post.status === 'scheduled' && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Prévu le {new Date(post.date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
