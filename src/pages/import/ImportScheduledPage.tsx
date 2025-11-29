import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Clock, Plus, Calendar, TrendingUp, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ImportScheduledPage() {
  const [schedules, setSchedules] = useState([
    {
      id: '1',
      name: 'Import AliExpress Quotidien',
      source_type: 'url',
      frequency: 'daily',
      next_run: '2024-12-01T10:00:00Z',
      active: true,
      last_run_status: 'completed'
    },
    {
      id: '2',
      name: 'Sync CSV Hebdomadaire',
      source_type: 'csv',
      frequency: 'weekly',
      next_run: '2024-12-03T14:00:00Z',
      active: false,
      last_run_status: 'pending'
    }
  ])

  const toggleSchedule = (id: string) => {
    setSchedules(prev =>
      prev.map(s => (s.id === id ? { ...s, active: !s.active } : s))
    )
  }

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'hourly': return 'Toutes les heures'
      case 'daily': return 'Quotidien'
      case 'weekly': return 'Hebdomadaire'
      default: return freq
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Imports Planifiés</h1>
          <p className="text-muted-foreground">
            Automatisez vos imports selon un planning
          </p>
        </div>
        <Link to="/import/scheduled/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Planning
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plannings</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {schedules.filter(s => s.active).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactifs</p>
                <p className="text-2xl font-bold text-gray-600">
                  {schedules.filter(s => !s.active).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des plannings */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Plannings</CardTitle>
          <CardDescription>
            Gérez vos imports automatiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Switch
                    checked={schedule.active}
                    onCheckedChange={() => toggleSchedule(schedule.id)}
                  />
                  <div>
                    <p className="font-medium">{schedule.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getFrequencyLabel(schedule.frequency)} • Type: {schedule.source_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prochain run: {new Date(schedule.next_run).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={schedule.active ? 'default' : 'secondary'}>
                    {schedule.active ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
