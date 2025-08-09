import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Clock, 
  Plus, 
  Pause, 
  Play, 
  Settings, 
  Calendar, 
  Zap,
  Timer,
  Repeat
} from "lucide-react"
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
      <Badge 
        variant={isActive ? "default" : "secondary"} 
        className={`flex items-center gap-1 ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
      >
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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-hero p-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">Planification Ultra Pro</h2>
              <p className="text-xl opacity-90">
                Automatisez vos imports avec des planifications intelligentes
              </p>
            </div>
            <Badge className="bg-gradient-accent text-white px-4 py-2 font-bold animate-pulse-glow">
              <Timer className="h-4 w-4 mr-2" />
              AUTO SCHEDULER
            </Badge>
          </div>

          {/* Schedule Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{scheduledImports.filter(s => s.is_active).length}</div>
                    <p className="text-sm opacity-80">Planifications Actives</p>
                  </div>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Play className="h-5 w-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{scheduledImports.length}</div>
                    <p className="text-sm opacity-80">Total Planifications</p>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Repeat className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">3.2K</div>
                    <p className="text-sm opacity-80">Produits Planifiés</p>
                  </div>
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Scheduled Imports Management */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Imports Planifiés
              </CardTitle>
              <CardDescription className="text-lg">
                Gérez vos imports automatiques avec des planifications personnalisées
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:bg-gradient-accent transition-all duration-300">
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
                    className="w-full bg-gradient-primary hover:bg-gradient-accent"
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
        <CardContent>
          {scheduledImports.length > 0 ? (
            <div className="space-y-4">
              {scheduledImports.map((scheduledImport) => (
                <Card 
                  key={scheduledImport.id} 
                  className="group hover:shadow-glow transition-all duration-300 border-2 hover:border-primary/20"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                          <span className="text-2xl">{getPlatformIcon(scheduledImport.platform)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{scheduledImport.name}</div>
                          <div className="text-muted-foreground">
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <Repeat className="h-4 w-4" />
                                {getFrequencyLabel(scheduledImport.frequency)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Prochaine: {format(new Date(scheduledImport.next_execution), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            {scheduledImport.last_execution && (
                              <div className="text-sm mt-1 opacity-75">
                                Dernière: {format(new Date(scheduledImport.last_execution), 'dd MMM yyyy', { locale: fr })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(scheduledImport.is_active)}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleScheduledImport({ id: scheduledImport.id, is_active: !scheduledImport.is_active })}
                          className="hover:bg-primary/10"
                        >
                          {scheduledImport.is_active ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Activer
                            </>
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Timer className="h-12 w-12 text-primary opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun import planifié</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre premier import automatique pour gagner du temps
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-primary hover:bg-gradient-accent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une planification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}