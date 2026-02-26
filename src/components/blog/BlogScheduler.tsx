import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Calendar as CalendarIcon, Clock, Plus, Edit, Trash2,
  Play, Pause, Settings, BarChart3, Target, Zap,
  CheckCircle, AlertCircle, Clock3
} from 'lucide-react'
import { format, addDays, addWeeks, addMonths } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ScheduledPost {
  id: string
  title: string
  category: string
  scheduledDate: Date
  status: 'scheduled' | 'published' | 'failed'
  autoOptimize: boolean
  socialMedia: {
    facebook: boolean
    twitter: boolean
    linkedin: boolean
    instagram: boolean
  }
  estimatedViews: number
}

interface AutomationRule {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  category: string
  isActive: boolean
  template: string
  keywords: string[]
}

export function BlogScheduler() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCreatingRule, setIsCreatingRule] = useState(false)
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    frequency: 'weekly',
    time: '09:00',
    isActive: true
  })

  const scheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      title: 'Guide Dropshipping 2024',
      category: 'Dropshipping',
      scheduledDate: addDays(new Date(), 1),
      status: 'scheduled',
      autoOptimize: true,
      socialMedia: { facebook: true, twitter: true, linkedin: false, instagram: true },
      estimatedViews: 1200
    },
    {
      id: '2',
      title: 'Stratégies Marketing Avancées',
      category: 'Marketing',
      scheduledDate: addDays(new Date(), 3),
      status: 'scheduled',
      autoOptimize: false,
      socialMedia: { facebook: true, twitter: false, linkedin: true, instagram: false },
      estimatedViews: 850
    },
    {
      id: '3',
      title: 'Analyse Produits Tendance',
      category: 'Analyse',
      scheduledDate: addWeeks(new Date(), 1),
      status: 'scheduled',
      autoOptimize: true,
      socialMedia: { facebook: true, twitter: true, linkedin: true, instagram: true },
      estimatedViews: 2100
    }
  ]

  const automationRules: AutomationRule[] = [
    {
      id: '1',
      name: 'Articles Hebdomadaires Dropshipping',
      frequency: 'weekly',
      dayOfWeek: 1, // Lundi
      time: '09:00',
      category: 'Dropshipping',
      isActive: true,
      template: 'Guide Dropshipping Complet',
      keywords: ['dropshipping', 'produits gagnants', 'fournisseurs']
    },
    {
      id: '2',
      name: 'Tips Marketing Bi-hebdomadaires',
      frequency: 'weekly',
      dayOfWeek: 3, // Mercredi
      time: '14:00',
      category: 'Marketing',
      isActive: true,
      template: 'Stratégie Marketing Avancée',
      keywords: ['marketing', 'publicité', 'conversion']
    },
    {
      id: '3',
      name: 'Tendances Mensuelles',
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '10:00',
      category: 'Tendances',
      isActive: false,
      template: 'Tendances E-commerce',
      keywords: ['tendances', 'innovation', 'futur']
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock3 className="h-4 w-4" />
      case 'published':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const postsForSelectedDate = scheduledPosts.filter(post => 
    format(post.scheduledDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  )

  const upcomingPosts = scheduledPosts
    .filter(post => post.scheduledDate > new Date())
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
    .slice(0, 5)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Planificateur de Blog</h1>
          <p className="text-muted-foreground">
            Automatisez et planifiez vos publications
          </p>
        </div>
        <Dialog open={isCreatingRule} onOpenChange={setIsCreatingRule}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Règle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Règle d'Automatisation</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de la règle</Label>
                  <Input placeholder="Ex: Articles Hebdomadaires" />
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dropshipping">Dropshipping</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="analyse">Analyse</SelectItem>
                      <SelectItem value="tendances">Tendances</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Fréquence</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Jour</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Jour" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Lundi</SelectItem>
                      <SelectItem value="2">Mardi</SelectItem>
                      <SelectItem value="3">Mercredi</SelectItem>
                      <SelectItem value="4">Jeudi</SelectItem>
                      <SelectItem value="5">Vendredi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Heure</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
              </div>

              <div>
                <Label>Template à utiliser</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guide">Guide Dropshipping Complet</SelectItem>
                    <SelectItem value="analyse">Analyse Produit Gagnant</SelectItem>
                    <SelectItem value="marketing">Stratégie Marketing Avancée</SelectItem>
                    <SelectItem value="tendances">Tendances E-commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mots-clés (séparés par des virgules)</Label>
                <Input placeholder="dropshipping, produits gagnants, e-commerce" />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active" />
                <Label htmlFor="active">Règle active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreatingRule(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsCreatingRule(false)}>
                  Créer Règle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="scheduled">Programmés</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendrier */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendrier Editorial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border pointer-events-auto"
                />
              </CardContent>
            </Card>

            {/* Articles du jour sélectionné */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {format(selectedDate, 'dd MMMM yyyy', { locale: getDateFnsLocale() })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postsForSelectedDate.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun article programmé</p>
                    <p className="text-sm">pour cette date</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {postsForSelectedDate.map((post) => (
                      <div key={post.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(post.status)}
                          <span className="font-medium text-sm">{post.title}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <Badge variant="outline">{post.category}</Badge>
                          <span>{format(post.scheduledDate, 'HH:mm')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prochaines publications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Prochaines Publications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingPosts.map((post) => (
                  <div key={post.id} className="p-4 border rounded-lg space-y-3">
                    <div>
                      <h3 className="font-medium text-sm mb-1">{post.title}</h3>
                      <Badge variant="outline" className="text-xs">{post.category}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3" />
                        {format(post.scheduledDate, 'dd MMM yyyy à HH:mm', { locale: getDateFnsLocale() })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        {post.estimatedViews.toLocaleString()} vues estimées
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${getStatusColor(post.status)}`}>
                        {getStatusIcon(post.status)}
                        {post.status === 'scheduled' ? 'Programmé' : post.status}
                      </div>
                      {post.autoOptimize && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto IA
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Articles Programmés ({scheduledPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{post.title}</h3>
                        <Badge variant="outline">{post.category}</Badge>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${getStatusColor(post.status)}`}>
                          {getStatusIcon(post.status)}
                          {post.status === 'scheduled' ? 'Programmé' : post.status}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {format(post.scheduledDate, 'dd MMM yyyy à HH:mm', { locale: getDateFnsLocale() })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {post.estimatedViews.toLocaleString()} vues
                        </span>
                        {post.autoOptimize && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Auto IA
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Règles d'Automatisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant="outline">{rule.category}</Badge>
                        {rule.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Fréquence: {rule.frequency === 'weekly' ? 'Hebdomadaire' : 
                                    rule.frequency === 'daily' ? 'Quotidien' : 'Mensuel'} à {rule.time}
                        </p>
                        <p>Template: {rule.template}</p>
                        <p>Mots-clés: {rule.keywords.join(', ')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{scheduledPosts.length}</p>
                    <p className="text-sm text-muted-foreground">Articles programmés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{automationRules.filter(r => r.isActive).length}</p>
                    <p className="text-sm text-muted-foreground">Règles actives</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {scheduledPosts.reduce((sum, post) => sum + post.estimatedViews, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Vues estimées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}