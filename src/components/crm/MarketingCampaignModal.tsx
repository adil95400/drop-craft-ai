import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Search, 
  Facebook, 
  Target,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react'

interface MarketingCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export const MarketingCampaignModal: React.FC<MarketingCampaignModalProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const [campaignType, setCampaignType] = useState<'email' | 'google_ads' | 'facebook_ads'>('email')
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    budget: '',
    audience: '',
    schedule: '',
    // Email specific
    subject: '',
    content: '',
    // Ads specific
    keywords: '',
    adText: '',
    targetAge: '',
    targetLocation: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const campaignData = {
      name: formData.name,
      type: campaignType,
      budget: parseFloat(formData.budget) || 0,
      schedule: formData.schedule,
      ...getCampaignSpecificData()
    }

    onSubmit(campaignData)
    resetForm()
  }

  const getCampaignSpecificData = () => {
    switch (campaignType) {
      case 'email':
        return {
          subject: formData.subject,
          content: formData.content,
          audience: formData.audience
        }
      case 'google_ads':
        return {
          keywords: formData.keywords.split(',').map(k => k.trim()),
          adText: formData.adText
        }
      case 'facebook_ads':
        return {
          audience: {
            age: formData.targetAge,
            location: formData.targetLocation
          },
          creative: {
            text: formData.adText
          }
        }
      default:
        return {}
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      budget: '',
      audience: '',
      schedule: '',
      subject: '',
      content: '',
      keywords: '',
      adText: '',
      targetAge: '',
      targetLocation: ''
    })
    setCampaignType('email')
  }

  const getCampaignIcon = () => {
    switch (campaignType) {
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'google_ads':
        return <Search className="w-5 h-5" />
      case 'facebook_ads':
        return <Facebook className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const getCampaignTitle = () => {
    switch (campaignType) {
      case 'email':
        return 'Campagne Email'
      case 'google_ads':
        return 'Campagne Google Ads'
      case 'facebook_ads':
        return 'Campagne Facebook Ads'
      default:
        return 'Nouvelle Campagne'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getCampaignIcon()}
            {getCampaignTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Type de campagne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  className={`p-4 border rounded-lg text-left transition-all ${
                    campaignType === 'email' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setCampaignType('email')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="font-medium">Email Marketing</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Newsletters et emails automatisés
                  </p>
                  <Badge variant="outline" className="mt-2">Gratuit</Badge>
                </button>

                <button
                  type="button"
                  className={`p-4 border rounded-lg text-left transition-all ${
                    campaignType === 'google_ads' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setCampaignType('google_ads')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Google Ads</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Publicités sur Google Search
                  </p>
                  <Badge variant="outline" className="mt-2">Payant</Badge>
                </button>

                <button
                  type="button"
                  className={`p-4 border rounded-lg text-left transition-all ${
                    campaignType === 'facebook_ads' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setCampaignType('facebook_ads')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Facebook Ads</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Publicités Facebook et Instagram
                  </p>
                  <Badge variant="outline" className="mt-2">Payant</Badge>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la campagne</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Promo Black Friday 2024"
                  required
                />
              </div>

              {campaignType !== 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (€)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      placeholder="100"
                      className="pl-9"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="schedule">Programmation</Label>
                <Select value={formData.schedule} onValueChange={(value) => setFormData({...formData, schedule: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Quand lancer la campagne?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immédiatement</SelectItem>
                    <SelectItem value="scheduled">Programmer</SelectItem>
                    <SelectItem value="draft">Sauvegarder en brouillon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Specific Content */}
          {campaignType === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contenu Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audience">Audience</Label>
                  <Select value={formData.audience} onValueChange={(value) => setFormData({...formData, audience: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les clients</SelectItem>
                      <SelectItem value="vip">Clients VIP</SelectItem>
                      <SelectItem value="regular">Clients réguliers</SelectItem>
                      <SelectItem value="new">Nouveaux clients</SelectItem>
                      <SelectItem value="inactive">Clients inactifs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Objet de l'email</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="🔥 Offre exclusive : -50% sur tout le site !"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenu de l'email</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Rédigez le contenu de votre email..."
                    className="min-h-[120px]"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {campaignType === 'google_ads' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Configuration Google Ads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keywords">Mots-clés (séparés par des virgules)</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                    placeholder="dropshipping, e-commerce, boutique en ligne"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Séparez chaque mot-clé par une virgule
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adText">Texte de l'annonce</Label>
                  <Textarea
                    id="adText"
                    value={formData.adText}
                    onChange={(e) => setFormData({...formData, adText: e.target.value})}
                    placeholder="Créez votre boutique en ligne en quelques clics. Solutions e-commerce complètes."
                    className="min-h-[80px]"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {campaignType === 'facebook_ads' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Facebook className="w-5 h-5" />
                  Configuration Facebook Ads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAge">Tranche d'âge</Label>
                    <Select value={formData.targetAge} onValueChange={(value) => setFormData({...formData, targetAge: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez l'âge" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-24">18-24 ans</SelectItem>
                        <SelectItem value="25-34">25-34 ans</SelectItem>
                        <SelectItem value="35-44">35-44 ans</SelectItem>
                        <SelectItem value="45-54">45-54 ans</SelectItem>
                        <SelectItem value="55+">55+ ans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetLocation">Localisation</Label>
                    <Input
                      id="targetLocation"
                      value={formData.targetLocation}
                      onChange={(e) => setFormData({...formData, targetLocation: e.target.value})}
                      placeholder="France, Belgique, Suisse..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adText">Texte de la publicité</Label>
                  <Textarea
                    id="adText"
                    value={formData.adText}
                    onChange={(e) => setFormData({...formData, adText: e.target.value})}
                    placeholder="Découvrez notre sélection exclusive de produits tendance..."
                    className="min-h-[80px]"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estimated Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance estimée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {campaignType === 'email' ? '2,500' : '15,000'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {campaignType === 'email' ? 'Destinataires' : 'Impressions estimées'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {campaignType === 'email' ? '18%' : '3.2%'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {campaignType === 'email' ? 'Taux d\'ouverture' : 'CTR estimé'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {campaignType === 'email' ? '150' : '480'}
                  </div>
                  <div className="text-sm text-muted-foreground">Clics estimés</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer la campagne
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}