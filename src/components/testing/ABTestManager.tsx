import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, Play, Pause, Trash2 } from 'lucide-react'

interface ABTest {
  id: string
  name: string
  status: 'draft' | 'running' | 'completed'
  variants: Array<{
    name: string
    traffic: number
    conversions: number
    revenue: number
  }>
  created_at: string
}

export function ABTestManager() {
  const [tests, setTests] = useState<ABTest[]>([
    {
      id: '1',
      name: 'Prix du produit A',
      status: 'running',
      variants: [
        { name: 'Contrôle (19.99€)', traffic: 50, conversions: 45, revenue: 899.55 },
        { name: 'Variante (24.99€)', traffic: 50, conversions: 38, revenue: 949.62 }
      ],
      created_at: new Date().toISOString()
    }
  ])

  const [newTestName, setNewTestName] = useState('')

  const createTest = () => {
    if (!newTestName.trim()) return

    const newTest: ABTest = {
      id: Date.now().toString(),
      name: newTestName,
      status: 'draft',
      variants: [
        { name: 'Contrôle', traffic: 50, conversions: 0, revenue: 0 },
        { name: 'Variante A', traffic: 50, conversions: 0, revenue: 0 }
      ],
      created_at: new Date().toISOString()
    }

    setTests([...tests, newTest])
    setNewTestName('')
  }

  const toggleTest = (testId: string) => {
    setTests(tests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          status: test.status === 'running' ? 'completed' : 'running'
        }
      }
      return test
    }))
  }

  const deleteTest = (testId: string) => {
    setTests(tests.filter(test => test.id !== testId))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Créer un nouveau test A/B
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="test-name">Nom du test</Label>
              <Input
                id="test-name"
                placeholder="Ex: Test de prix produit..."
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={createTest}>
                Créer le test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>{test.name}</CardTitle>
                  <Badge variant={
                    test.status === 'running' ? 'default' :
                    test.status === 'completed' ? 'secondary' : 'outline'
                  }>
                    {test.status === 'running' ? 'En cours' :
                     test.status === 'completed' ? 'Terminé' : 'Brouillon'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTest(test.id)}
                  >
                    {test.status === 'running' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Arrêter
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Démarrer
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTest(test.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {test.variants.map((variant, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{variant.name}</span>
                        <Badge variant="outline">{variant.traffic}% trafic</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conversions:</span>
                          <span className="font-medium">{variant.conversions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenu:</span>
                          <span className="font-medium">{variant.revenue.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taux conversion:</span>
                          <span className="font-medium">
                            {variant.traffic > 0 
                              ? ((variant.conversions / variant.traffic) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
