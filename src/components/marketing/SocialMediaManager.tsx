import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Instagram, Twitter, Facebook, Linkedin, Youtube, 
  Calendar, Clock, Image, Video, Link, Hash,
  Send, Save, Eye, TrendingUp, Users, Heart
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SocialPost {
  id: string
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'youtube'
  content: string
  mediaUrls: string[]
  hashtags: string[]
  scheduledAt?: string
  status: 'draft' | 'scheduled' | 'published'
  engagement?: {
    likes: number
    comments: number
    shares: number
    views?: number
  }
}

interface SocialAccount {
  platform: string
  username: string
  followers: number
  isConnected: boolean
  profileImage: string
}

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-500' }
]

export function SocialMediaManager() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      platform: 'instagram',
      username: '@votre_entreprise',
      followers: 15420,
      isConnected: true,
      profileImage: '/placeholder.svg'
    },
    {
      platform: 'facebook',
      username: 'Votre Entreprise',
      followers: 8350,
      isConnected: true,
      profileImage: '/placeholder.svg'
    },
    {
      platform: 'linkedin',
      username: 'Votre Entreprise',
      followers: 2140,
      isConnected: false,
      profileImage: '/placeholder.svg'
    }
  ])

  const [currentPost, setCurrentPost] = useState({
    platform: 'instagram' as const,
    content: '',
    hashtags: [] as string[],
    mediaUrls: [] as string[],
    scheduledAt: ''
  })

  const [hashtagInput, setHashtagInput] = useState('')
  const { toast } = useToast()

  // Sample posts
  useEffect(() => {
    setPosts([
      {
        id: '1',
        platform: 'instagram',
        content: 'Découvrez notre nouvelle collection ! 🌟 Des designs innovants qui allient style et fonctionnalité.',
        hashtags: ['#nouveauté', '#design', '#innovation', '#style'],
        mediaUrls: ['/placeholder.svg'],
        status: 'published',
        engagement: { likes: 245, comments: 18, shares: 12 }
      },
      {
        id: '2',
        platform: 'facebook',
        content: 'Merci à tous nos clients pour leur confiance ! Nous continuons à innover pour vous offrir le meilleur.',
        hashtags: ['#merci', '#clients', '#innovation'],
        mediaUrls: [],
        status: 'published',
        engagement: { likes: 156, comments: 32, shares: 28 }
      },
      {
        id: '3',
        platform: 'linkedin',
        content: 'Notre équipe grandit ! Nous recherchons des talents passionnés pour rejoindre notre aventure.',
        hashtags: ['#recrutement', '#équipe', '#carrières'],
        mediaUrls: [],
        scheduledAt: '2024-01-25T10:00:00Z',
        status: 'scheduled',
        engagement: { likes: 89, comments: 15, shares: 22 }
      }
    ])
  }, [])

  const addHashtag = () => {
    if (hashtagInput.trim() && !currentPost.hashtags.includes(hashtagInput.trim())) {
      setCurrentPost({
        ...currentPost,
        hashtags: [...currentPost.hashtags, hashtagInput.trim()]
      })
      setHashtagInput('')
    }
  }

  const removeHashtag = (hashtag: string) => {
    setCurrentPost({
      ...currentPost,
      hashtags: currentPost.hashtags.filter(h => h !== hashtag)
    })
  }

  const handleSavePost = async (action: 'save' | 'schedule' | 'publish') => {
    if (!currentPost.content.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir du contenu pour le post",
        variant: "destructive"
      })
      return
    }

    try {
      const postData: SocialPost = {
        id: Date.now().toString(),
        platform: currentPost.platform,
        content: currentPost.content,
        hashtags: currentPost.hashtags,
        mediaUrls: currentPost.mediaUrls,
        scheduledAt: action === 'schedule' ? currentPost.scheduledAt : undefined,
        status: action === 'save' ? 'draft' : action === 'schedule' ? 'scheduled' : 'published'
      }

      if (action === 'publish') {
        postData.engagement = {
          likes: Math.floor(Math.random() * 100) + 10,
          comments: Math.floor(Math.random() * 20) + 1,
          shares: Math.floor(Math.random() * 15) + 1
        }
      }

      setPosts([postData, ...posts])

      toast({
        title: action === 'save' ? "Brouillon sauvegardé" : action === 'schedule' ? "Post programmé" : "Post publié",
        description: "L'action a été effectuée avec succès"
      })

      // Reset form
      setCurrentPost({
        platform: 'instagram',
        content: '',
        hashtags: [],
        mediaUrls: [],
        scheduledAt: ''
      })

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'action",
        variant: "destructive"
      })
    }
  }

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.id === platform)
    return platformData?.icon || Instagram
  }

  const getPlatformColor = (platform: string) => {
    const platformData = platforms.find(p => p.id === platform)
    return platformData?.color || 'bg-gray-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200'
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestionnaire Réseaux Sociaux</h2>
          <p className="text-muted-foreground">
            Créez, programmez et suivez vos publications sur tous vos réseaux
          </p>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {accounts.map((account, index) => {
          const PlatformIcon = getPlatformIcon(account.platform)
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getPlatformColor(account.platform)} text-white`}>
                    <PlatformIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{account.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(account.followers)} abonnés
                    </div>
                  </div>
                  <Badge variant={account.isConnected ? "default" : "secondary"} className="text-xs">
                    {account.isConnected ? 'Connecté' : 'Déconnecté'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Post Creator */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Créer un Post</TabsTrigger>
              <TabsTrigger value="posts">Posts Récents</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nouveau Post</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Platform Selection */}
                  <div>
                    <Label>Plateforme</Label>
                    <Select 
                      value={currentPost.platform} 
                      onValueChange={(value: any) => setCurrentPost({ ...currentPost, platform: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => {
                          const Icon = platform.icon
                          return (
                            <SelectItem key={platform.id} value={platform.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {platform.name}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content */}
                  <div>
                    <Label htmlFor="post-content">Contenu du post</Label>
                    <Textarea
                      id="post-content"
                      placeholder="Que voulez-vous partager ?"
                      value={currentPost.content}
                      onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                      rows={4}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {currentPost.content.length}/280 caractères
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <Label>Hashtags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Ajouter un hashtag"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                      />
                      <Button type="button" onClick={addHashtag} size="sm">
                        <Hash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {currentPost.hashtags.map((hashtag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer">
                          {hashtag}
                          <button 
                            onClick={() => removeHashtag(hashtag)}
                            className="ml-1 text-xs hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Media Upload */}
                  <div>
                    <Label>Médias</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Glissez vos images ou vidéos ici
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Choisir des fichiers
                      </Button>
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div>
                    <Label htmlFor="schedule-date">Programmer pour plus tard (optionnel)</Label>
                    <Input
                      id="schedule-date"
                      type="datetime-local"
                      value={currentPost.scheduledAt}
                      onChange={(e) => setCurrentPost({ ...currentPost, scheduledAt: e.target.value })}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleSavePost('save')}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Brouillon
                    </Button>
                    
                    {currentPost.scheduledAt && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleSavePost('schedule')}
                        className="gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Programmer
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => handleSavePost('publish')}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Publier maintenant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {posts.map((post) => {
                const PlatformIcon = getPlatformIcon(post.platform)
                return (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getPlatformColor(post.platform)} text-white`}>
                          <PlatformIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                            {post.scheduledAt && (
                              <div className="text-xs text-muted-foreground">
                                Programmé pour {new Date(post.scheduledAt).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm mb-2">{post.content}</p>
                          
                          {post.hashtags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mb-2">
                              {post.hashtags.map((hashtag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {hashtag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {post.engagement && (
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {post.engagement.likes}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {post.engagement.comments}
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {post.engagement.shares}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>
          </Tabs>
        </div>

        {/* Analytics Panel */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1 rounded-full ${getPlatformColor(currentPost.platform)} text-white`}>
                    <Instagram className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium">@votre_entreprise</span>
                </div>
                
                <div className="text-sm mb-2">
                  {currentPost.content || "Votre contenu apparaîtra ici..."}
                </div>
                
                {currentPost.hashtags.length > 0 && (
                  <div className="text-xs text-blue-600">
                    {currentPost.hashtags.join(' ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performances Récentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Publications ce mois</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Engagement moyen</span>
                <span className="font-medium">5.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nouveaux abonnés</span>
                <span className="font-medium text-green-600">+127</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Meilleure heure</span>
                <span className="font-medium">18h-20h</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}