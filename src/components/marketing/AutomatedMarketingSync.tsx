import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Bot, Zap, PlayCircle, CheckCircle2, Target } from 'lucide-react'

export function AutomatedMarketingSync() {
  const mockRules = [
    {
      id: '1',
      name: 'Retargeting Automatique',
      description: 'Recibler automatiquement les visiteurs qui n\'ont pas converti',
      is_active: true,
      success_rate: 85.2,
      execution_count: 1234
    },
    {
      id: '2',
      name: 'Email Abandon de Panier',
      description: 'Envoyer un email automatique en cas d\'abandon de panier',
      is_active: true,
      success_rate: 72.8,
      execution_count: 567
    }
  ]

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
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Règles Actives</p>
                <p className="text-2xl font-bold text-green-600">2</p>
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
                <p className="text-2xl font-bold">1,801</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Succès</p>
                <p className="text-2xl font-bold text-green-600">79.0%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Économies</p>
                <p className="text-2xl font-bold text-primary">€2,450</p>
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
          <div className="space-y-4">
            {mockRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{rule.success_rate.toFixed(1)}% succès</Badge>
                    <Switch checked={rule.is_active} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}