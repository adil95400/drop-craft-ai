import { useState } from 'react'
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
  Clock, Image, Hash,
  Send, Save, TrendingUp, Users, Heart, Loader2, Plus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSocialMedia, SocialPost } from '@/hooks/useSocialMedia'

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-500' }
]

export function SocialMediaManager() {
  const { accounts, posts, totalEngagement, isLoading, createPost, connectAccount, isCreating } = useSocialMedia()
  const { toast } = useToast()

  const [currentPost, setCurrentPost] = useState({
    platform: 'instagram' as const,
    content: '',
    hashtags: [] as string[],
    mediaUrls: [] as string[],
    scheduledAt: ''
  })

  const [hashtagInput, setHashtagInput] = useState('')

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

    const postData: Omit<SocialPost, 'id'> = {
      platform: currentPost.platform,
      content: currentPost.content,
      hashtags: currentPost.hashtags,
      mediaUrls: currentPost.mediaUrls,
      scheduledAt: action === 'schedule' ? currentPost.scheduledAt : undefined,
      status: action === 'save' ? 'draft' : action === 'schedule' ? 'scheduled' : 'published',
      engagement: action === 'publish' ? { likes: 0, comments: 0, shares: 0, views: 0 } : undefined
    }

    createPost(postData)

    // Reset form
    setCurrentPost({
      platform: 'instagram',
      content: '',
      hashtags: [],
      mediaUrls: [],
      scheduledAt: ''
    })
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {accounts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Aucun compte social connecté</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {platforms.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <Button
                      key={platform.id}
                      variant="outline"
                      size="sm"
                      onClick={() => connectAccount(platform.id)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {platform.name}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account, index) => {
            const PlatformIcon = getPlatformIcon(account.platform)
            return (
              <Card key={account.id || index}>
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
          })
        )}
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
                      disabled={isCreating}
                    >
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Brouillon
                    </Button>
                    
                    {currentPost.scheduledAt && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleSavePost('schedule')}
                        className="gap-2"
                        disabled={isCreating}
                      >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                        Programmer
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => handleSavePost('publish')}
                      className="gap-2"
                      disabled={isCreating}
                    >
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Publier maintenant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Aucune publication pour le moment</p>
                    <p className="text-sm text-muted-foreground mt-1">Créez votre première publication ci-dessus</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => {
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
                })
              )}
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
                <span className="font-medium">{posts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total likes</span>
                <span className="font-medium">{totalEngagement.likes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total commentaires</span>
                <span className="font-medium">{totalEngagement.comments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total partages</span>
                <span className="font-medium">{totalEngagement.shares}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}