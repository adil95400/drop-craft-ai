import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Bot, Zap, PlayCircle, CheckCircle2, Target, Plus, Loader2 } from 'lucide-react'
import { useMarketingAutomations } from '@/hooks/useMarketingAutomations'

export function AutomatedMarketingSync() {
  const { automations, isLoading, toggleAutomation, isToggling, createAutomation, isCreating } = useMarketingAutomations()

  const activeRules = automations.filter(a => a.is_active).length
  const totalExecutions = automations.reduce((sum, a) => sum + (a.trigger_count || 0), 0)
  const avgSuccessRate = automations.length > 0 
    ? automations.reduce((sum, a) => sum + ((a.current_metrics as any)?.success_rate || 0), 0) / automations.length 
    : 0

  const handleCreateDefault = () => {
    createAutomation({
      name: 'Nouvelle automatisation',
      trigger_type: 'event',
      is_active: false,
      actions: [],
      trigger_config: {}
    })
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Automatisation Marketing IA
          </h2>
          <p className="text-muted-foreground">
            Gérez vos règles d'automatisation marketing intelligentes
          </p>
        </div>
        <Button onClick={handleCreateDefault} disabled={isCreating}>
          {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Nouvelle règle
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Règles Actives</p>
                <p className="text-2xl font-bold text-green-600">{activeRules}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Exécutions</p>
                <p className="text-2xl font-bold">{totalExecutions.toLocaleString('fr-FR')}</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Succès Moyen</p>
                <p className="text-2xl font-bold text-green-600">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Règles</p>
                <p className="text-2xl font-bold text-primary">{automations.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Règles d'Automatisation</CardTitle>
        </CardHeader>
        <CardContent>
          {automations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune automatisation</p>
              <p className="text-sm">Créez votre première règle d'automatisation marketing</p>
              <Button className="mt-4" onClick={handleCreateDefault}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une règle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {automations.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Type: {rule.trigger_type} • {rule.trigger_count || 0} exécutions
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {rule.last_triggered_at && (
                        <Badge variant="outline">
                          Dernière: {new Date(rule.last_triggered_at).toLocaleDateString('fr-FR')}
                        </Badge>
                      )}
                      <Switch 
                        checked={rule.is_active || false} 
                        disabled={isToggling}
                        onCheckedChange={(checked) => toggleAutomation({ id: rule.id, is_active: checked })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}