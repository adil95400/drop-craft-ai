/**
 * Page Profil Utilisateur - Design Premium
 */
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useAvatarUpload } from '@/hooks/useAvatarUpload'
import { useSessions } from '@/hooks/useSessions'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  Camera,
  Save,
  Loader2,
  Shield,
  Star,
  Crown,
  Calendar,
  Activity,
  TrendingUp,
  Package,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Github,
  Smartphone,
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@/integrations/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

interface ProfileFormData {
  full_name: string
  email: string
  phone: string
  company: string
  website: string
  bio: string
  location: string
  twitter: string
  linkedin: string
  github: string
}

export default function ProfilePage() {
  const locale = useDateFnsLocale()
  const { user } = useAuth()
  const { profile, isLoading: profileLoading, refetch } = useProfile()
  const { uploadAvatar, uploading: avatarUploading } = useAvatarUpload(refetch)
  const { sessions, isLoading: sessionsLoading } = useSessions()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    bio: '',
    location: '',
    twitter: '',
    linkedin: '',
    github: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        company: profile.company || '',
        website: profile.website || '',
        bio: profile.bio || '',
        location: profile.location || '',
        twitter: profile.twitter || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
      })
    }
  }, [profile, user])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAvatar(file)
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          company_name: formData.company,
          website: formData.website,
          bio: formData.bio,
          location: formData.location,
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          github: formData.github,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profil mis à jour avec succès')
      setIsEditing(false)
      refetch()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setIsSaving(false)
    }
  }

  // Calcul du score de complétion du profil
  const calculateProfileCompletion = () => {
    const fields = [
      formData.full_name,
      formData.phone,
      formData.company,
      formData.bio,
      formData.location
    ]
    const filledFields = fields.filter(f => f && f.trim() !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  const profileCompletion = calculateProfileCompletion()

  const getPlanBadge = () => {
    const plan = profile?.subscription_plan || 'free'
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: any }> = {
      free: { label: 'Free', variant: 'outline', icon: Star },
      pro: { label: 'Pro', variant: 'secondary', icon: Shield },
      business: { label: 'Business', variant: 'default', icon: Crown },
      enterprise: { label: 'Enterprise', variant: 'default', icon: Crown }
    }
    return badges[plan] || badges.free
  }

  const planBadge = getPlanBadge()

  if (profileLoading) {
    return (
      <ChannablePageWrapper
        title="Mon Profil"
        subtitle="Chargement..."
        description=""
        heroImage="analytics"
        badge={{ label: 'Profil', icon: User }}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ChannablePageWrapper>
    )
  }

  return (
    <>
      <Helmet>
        <title>Mon Profil - ShopOpti</title>
        <meta name="description" content="Gérez votre profil et vos informations personnelles" />
      </Helmet>

      <ChannablePageWrapper
        title="Mon Profil"
        subtitle="Compte"
        description="Gérez votre profil et vos informations personnelles"
        heroImage="analytics"
        badge={{ label: 'Profil', icon: User }}
      >
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Avatar & Basic Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                        {formData.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      onClick={handleAvatarClick}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  
                  <h3 className="mt-4 text-xl font-bold">
                    {formData.full_name || 'Utilisateur'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={planBadge.variant} className="gap-1">
                      <planBadge.icon className="w-3 h-3" />
                      {planBadge.label}
                    </Badge>
                    {profile?.email_verified && (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {profile?.products_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Produits</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {profile?.orders_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="p-1 rounded bg-primary/10">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      Complétion du profil
                    </CardTitle>
                  </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                  {profileCompletion < 100 && (
                    <p className="text-xs text-muted-foreground">
                      Complétez votre profil pour une meilleure expérience
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Member Since */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Membre depuis</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('fr-FR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Tabs defaultValue="info" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="activity">Activité</TabsTrigger>
                <TabsTrigger value="billing">Facturation</TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Informations personnelles</CardTitle>
                          <CardDescription>Vos informations de base</CardDescription>
                        </div>
                      </div>
                      <Button 
                        variant={isEditing ? "default" : "outline"} 
                        size="sm"
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : isEditing ? (
                          <Save className="w-4 h-4 mr-2" />
                        ) : null}
                        {isEditing ? 'Sauvegarder' : 'Modifier'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          Nom complet
                        </Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="Votre nom"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          Téléphone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          Localisation
                        </Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="Paris, France"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Parlez-nous de vous..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Business Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Informations professionnelles</CardTitle>
                        <CardDescription>Votre entreprise et site web</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          Entreprise
                        </Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="Nom de votre entreprise"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          Site web
                        </Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="https://votre-site.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Links */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5">
                        <LinkIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle>Réseaux sociaux</CardTitle>
                        <CardDescription>Vos liens professionnels</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-muted-foreground" />
                          Twitter
                        </Label>
                        <Input
                          id="twitter"
                          value={formData.twitter}
                          onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="@username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-muted-foreground" />
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="URL LinkedIn"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="github" className="flex items-center gap-2">
                          <Github className="w-4 h-4 text-muted-foreground" />
                          GitHub
                        </Label>
                        <Input
                          id="github"
                          value={formData.github}
                          onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="@username"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="p-1 rounded bg-primary/10">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        Produits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{profile?.products_count || 0}</div>
                      <p className="text-sm text-muted-foreground">Produits créés</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="p-1 rounded bg-primary/10">
                          <ShoppingCart className="w-4 h-4 text-primary" />
                        </div>
                        Commandes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{profile?.orders_count || 0}</div>
                      <p className="text-sm text-muted-foreground">Commandes traitées</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="p-1 rounded bg-primary/10">
                          <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        Imports
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{profile?.imports_count || 0}</div>
                      <p className="text-sm text-muted-foreground">Fichiers importés</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="p-1 rounded bg-primary/10">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{profile?.sessions_count || 0}</div>
                      <p className="text-sm text-muted-foreground">Connexions ce mois</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Sessions récentes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-primary" />
                      Sessions récentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune session enregistrée</p>
                    ) : (
                      <ul className="space-y-3">
                        {sessions.map((s) => (
                          <li key={s.id} className="flex items-start gap-3 text-sm">
                            <Smartphone className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="line-clamp-1">{s.user_agent?.split(' ').slice(0, 3).join(' ') || 'Navigateur inconnu'}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.ip_address ?? '—'}
                                {' · '}
                                {s.created_at
                                  ? formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale })
                                  : '—'}
                                {s.isCurrent && (
                                  <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1">Actuelle</Badge>
                                )}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle>Plan actuel</CardTitle>
                          <CardDescription>Votre abonnement</CardDescription>
                        </div>
                      </div>
                      <Badge variant={planBadge.variant} className="gap-1 text-base px-4 py-2">
                        <planBadge.icon className="w-4 h-4" />
                        {planBadge.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Crédits utilisés</p>
                        <p className="text-2xl font-bold mt-1">{profile?.credits_used || 0}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Crédits restants</p>
                        <p className="text-2xl font-bold mt-1">{profile?.credits_remaining || 0}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Renouvellement</p>
                        <p className="text-2xl font-bold mt-1">
                          {profile?.next_billing_date 
                            ? new Date(profile.next_billing_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                        Gérer l'abonnement
                      </Button>
                      <Button onClick={() => window.location.href = '/dashboard/billing'}>
                        Voir les factures
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </ChannablePageWrapper>
    </>
  )
}
