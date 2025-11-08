import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Clock, Play, Pause, Trash2, Plus, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ScheduledImport {
  id: string
  name: string
  sourceType: 'url' | 'xml' | 'ftp'
  sourceUrl: string
  schedule: string
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  active: boolean
  lastRun?: Date
  nextRun?: Date
}

export const ScheduledImportManager = () => {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<ScheduledImport[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sourceType: 'url' as const,
    sourceUrl: '',
    frequency: 'daily' as const,
    active: true
  })

  const handleCreateSchedule = () => {
    const newSchedule: ScheduledImport = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      schedule: getScheduleExpression(formData.frequency),
      nextRun: calculateNextRun(formData.frequency)
    }

    setSchedules([...schedules, newSchedule])
    setShowForm(false)
    setFormData({
      name: '',
      sourceType: 'url',
      sourceUrl: '',
      frequency: 'daily',
      active: true
    })

    toast({
      title: 'Import planifié créé',
      description: `L'import "${newSchedule.name}" a été configuré avec succès`
    })
  }

  const toggleSchedule = (id: string) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ))
  }

  const deleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id))
    toast({
      title: 'Import supprimé',
      description: 'La planification a été supprimée'
    })
  }

  const getScheduleExpression = (frequency: string): string => {
    const expressions: Record<string, string> = {
      'hourly': '0 * * * *',
      'daily': '0 2 * * *',
      'weekly': '0 2 * * 0',
      'monthly': '0 2 1 * *'
    }
    return expressions[frequency] || expressions['daily']
  }

  const calculateNextRun = (frequency: string): Date => {
    const now = new Date()
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  const getFrequencyLabel = (frequency: string): string => {
    const labels: Record<string, string> = {
      'hourly': 'Toutes les heures',
      'daily': 'Quotidien',
      'weekly': 'Hebdomadaire',
      'monthly': 'Mensuel'
    }
    return labels[frequency] || frequency
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Imports planifiés</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez des imports automatiques récurrents
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau planning
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un import planifié</CardTitle>
            <CardDescription>
              Configurez un import automatique qui s'exécutera selon la fréquence choisie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la planification</Label>
              <Input
                id="name"
                placeholder="Ex: Import produits fournisseur"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de source</Label>
                <Select
                  value={formData.sourceType}
                  onValueChange={(value: any) => setFormData({ ...formData, sourceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="xml">XML/RSS Feed</SelectItem>
                    <SelectItem value="ftp">FTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidien (2h du matin)</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire (Dimanche 2h)</SelectItem>
                    <SelectItem value="monthly">Mensuel (1er du mois 2h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceUrl">URL de la source</Label>
              <Input
                id="sourceUrl"
                placeholder="https://..."
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Activer immédiatement</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateSchedule} disabled={!formData.name || !formData.sourceUrl}>
                <Calendar className="h-4 w-4 mr-2" />
                Créer la planification
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {schedules.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun import planifié</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre premier import automatique pour synchroniser vos produits régulièrement
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une planification
            </Button>
          </CardContent>
        </Card>
      )}

      {schedules.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {schedules.map(schedule => (
            <Card key={schedule.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{schedule.name}</h3>
                      <Badge variant={schedule.active ? 'default' : 'secondary'}>
                        {schedule.active ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Badge variant="outline">
                        {getFrequencyLabel(schedule.frequency)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Type: {schedule.sourceType.toUpperCase()}</p>
                      <p>Source: {schedule.sourceUrl}</p>
                      <p>Cron: {schedule.schedule}</p>
                      {schedule.nextRun && (
                        <p>Prochaine exécution: {schedule.nextRun.toLocaleString('fr-FR')}</p>
                      )}
                      {schedule.lastRun && (
                        <p>Dernière exécution: {schedule.lastRun.toLocaleString('fr-FR')}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSchedule(schedule.id)}
                      title={schedule.active ? 'Désactiver' : 'Activer'}
                    >
                      {schedule.active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteSchedule(schedule.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
