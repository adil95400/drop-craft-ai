import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Plus, Pause, Play, Settings, Calendar } from "lucide-react"
import { useImportUltraPro } from "@/hooks/useImportUltraPro"
import { format, addDays, addWeeks, addMonths } from "date-fns"
import { fr } from "date-fns/locale"

export const ScheduledImportsUltraPro = () => {
  const { 
    scheduledImports, 
    createScheduledImport, 
    toggleScheduledImport 
  } = useImportUltraPro()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newImport, setNewImport] = useState({
    name: '',
    platform: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly'
  })

  const platforms = [
    { value: 'aliexpress', label: 'AliExpress', icon: '🛒' },
    { value: 'amazon', label: 'Amazon', icon: '📦' },
    { value: 'bigbuy', label: 'BigBuy', icon: '🏪' },
    { value: 'eprolo', label: 'EPROLO', icon: '🚀' }
  ]

  const getNextExecution = (frequency: string) => {
    const now = new Date()
    switch (frequency) {
      case 'daily':
        return addDays(now, 1)
      case 'weekly':
        return addWeeks(now, 1)
      case 'monthly':
        return addMonths(now, 1)
      default:
        return addDays(now, 1)
    }
  }

  const handleCreateImport = () => {
    const nextExecution = getNextExecution(newImport.frequency)
    
    createScheduledImport({
      name: newImport.name,
      platform: newImport.platform,
      frequency: newImport.frequency,
      next_execution: nextExecution.toISOString(),
      filter_config: {
        categories: ['electronics', 'fashion'],
        price_range: { min: 10, max: 500 }
      }
    })
    
    setIsCreateDialogOpen(false)
    setNewImport({ name: '', platform: '', frequency: 'weekly' })
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className="flex items-center gap-1">
        {isActive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        {isActive ? 'Actif' : 'Pausé'}
      </Badge>
    )
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel'
    }
    return labels[frequency as keyof typeof labels] || frequency
  }

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.value === platform)
    return platformData?.icon || '📦'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Imports Planifiés
            </CardTitle>
            <CardDescription>
              Automatisez vos imports avec des planifications personnalisées
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Planning
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un import planifié</DialogTitle>
                <DialogDescription>
                  Configurez un import automatique récurrent
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du planning</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Import AliExpress Weekly"
                    value={newImport.name}
                    onChange={(e) => setNewImport({ ...newImport, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="platform">Plateforme</Label>
                  <Select value={newImport.platform} onValueChange={(value) => setNewImport({ ...newImport, platform: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une plateforme" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          <div className="flex items-center gap-2">
                            <span>{platform.icon}</span>
                            <span>{platform.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select value={newImport.frequency} onValueChange={(value: any) => setNewImport({ ...newImport, frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreateImport} 
                  className="w-full"
                  disabled={!newImport.name || !newImport.platform}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Créer le planning
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {scheduledImports.length > 0 ? (
          <div className="space-y-3">
            {scheduledImports.map((scheduledImport) => (
              <div key={scheduledImport.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <span className="text-xl">{getPlatformIcon(scheduledImport.platform)}</span>
                  </div>
                  <div>
                    <div className="font-medium">{scheduledImport.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Fréquence: {getFrequencyLabel(scheduledImport.frequency)} • 
                      Prochaine exécution: {format(new Date(scheduledImport.next_execution), 'dd MMM yyyy', { locale: fr })}
                    </div>
                    {scheduledImport.last_execution && (
                      <div className="text-xs text-muted-foreground">
                        Dernière exécution: {format(new Date(scheduledImport.last_execution), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(scheduledImport.is_active)}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleScheduledImport({ id: scheduledImport.id, is_active: !scheduledImport.is_active })}
                  >
                    {scheduledImport.is_active ? 'Pause' : 'Activer'}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">Aucun import planifié</p>
            <p className="text-sm">Créez votre premier import automatique</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}