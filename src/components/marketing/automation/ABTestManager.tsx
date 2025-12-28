import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  FlaskConical, Plus, MoreVertical, Trash2, Play, Trophy, Loader2,
  BarChart3, TrendingUp, Users, Percent
} from 'lucide-react'
import { useCampaignABTests, CampaignABTest, ABTestVariant } from '@/hooks/useCampaignABTests'
import { useEmailCampaigns } from '@/hooks/useEmailCampaigns'

const TEST_TYPE_LABELS: Record<string, string> = {
  subject: 'Objet de l\'email',
  content: 'Contenu',
  send_time: 'Heure d\'envoi',
  sender_name: 'Nom de l\'expéditeur'
}

const WINNER_CRITERIA_LABELS: Record<string, string> = {
  open_rate: 'Taux d\'ouverture',
  click_rate: 'Taux de clic',
  conversion_rate: 'Taux de conversion'
}

export function ABTestManager() {
  const { abTests, isLoading, createABTest, updateABTest, deleteABTest, startABTest, selectWinner } = useCampaignABTests()
  const { campaigns } = useEmailCampaigns()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [selectedTest, setSelectedTest] = useState<CampaignABTest | null>(null)
  const [newTest, setNewTest] = useState({
    name: '',
    test_type: 'subject' as CampaignABTest['test_type'],
    campaign_id: '',
    winner_criteria: 'open_rate' as CampaignABTest['winner_criteria'],
    auto_select_winner: false,
    winner_after_hours: 24,
    variants: [
      { id: 'a', name: 'Variante A', subject: '', sent: 0, opened: 0, clicked: 0, converted: 0 },
      { id: 'b', name: 'Variante B', subject: '', sent: 0, opened: 0, clicked: 0, converted: 0 }
    ] as ABTestVariant[]
  })

  const handleCreate = () => {
    if (!newTest.name) return
    createABTest({
      name: newTest.name,
      test_type: newTest.test_type,
      campaign_id: newTest.campaign_id || undefined,
      winner_criteria: newTest.winner_criteria,
      auto_select_winner: newTest.auto_select_winner,
      winner_after_hours: newTest.winner_after_hours,
      variants: newTest.variants,
      traffic_split: { a: 50, b: 50 }
    })
    setShowCreateDialog(false)
    setNewTest({
      name: '',
      test_type: 'subject',
      campaign_id: '',
      winner_criteria: 'open_rate',
      auto_select_winner: false,
      winner_after_hours: 24,
      variants: [
        { id: 'a', name: 'Variante A', subject: '', sent: 0, opened: 0, clicked: 0, converted: 0 },
        { id: 'b', name: 'Variante B', subject: '', sent: 0, opened: 0, clicked: 0, converted: 0 }
      ]
    })
  }

  const calculateWinner = (test: CampaignABTest) => {
    if (test.variants.length < 2) return null
    const [a, b] = test.variants
    const aRate = test.winner_criteria === 'open_rate' ? (a.sent > 0 ? (a.opened / a.sent) * 100 : 0) :
                  test.winner_criteria === 'click_rate' ? (a.opened > 0 ? (a.clicked / a.opened) * 100 : 0) :
                  (a.clicked > 0 ? (a.converted / a.clicked) * 100 : 0)
    const bRate = test.winner_criteria === 'open_rate' ? (b.sent > 0 ? (b.opened / b.sent) * 100 : 0) :
                  test.winner_criteria === 'click_rate' ? (b.opened > 0 ? (b.clicked / b.opened) * 100 : 0) :
                  (b.clicked > 0 ? (b.converted / b.clicked) * 100 : 0)
    return aRate > bRate ? 'a' : bRate > aRate ? 'b' : null
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tests A/B</h2>
          <p className="text-sm text-muted-foreground">Optimisez vos campagnes avec des tests comparatifs</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Test A/B
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{abTests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{abTests.filter(t => t.status === 'running').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminés</p>
                <p className="text-2xl font-bold">{abTests.filter(t => t.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amélioration moy.</p>
                <p className="text-2xl font-bold">+12%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {abTests.length === 0 ? (
          <Card className="p-8 text-center">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun test A/B configuré</p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez des tests pour optimiser vos objets, contenus ou heures d'envoi
            </p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un test A/B
            </Button>
          </Card>
        ) : (
          abTests.map((test) => (
            <ABTestCard 
              key={test.id}
              test={test}
              onStart={() => startABTest(test.id)}
              onViewResults={() => { setSelectedTest(test); setShowResultsDialog(true) }}
              onSelectWinner={(winnerId) => selectWinner({ id: test.id, winnerId })}
              onDelete={() => deleteABTest(test.id)}
              suggestedWinner={calculateWinner(test)}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau Test A/B</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du test</Label>
                <Input 
                  placeholder="Ex: Test objet newsletter"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type de test</Label>
                <Select 
                  value={newTest.test_type} 
                  onValueChange={(v: CampaignABTest['test_type']) => setNewTest({ ...newTest, test_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEST_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campagne (optionnel)</Label>
                <Select 
                  value={newTest.campaign_id} 
                  onValueChange={(v) => setNewTest({ ...newTest, campaign_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une campagne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {campaigns.filter(c => c.status === 'draft').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Critère de victoire</Label>
                <Select 
                  value={newTest.winner_criteria} 
                  onValueChange={(v: CampaignABTest['winner_criteria']) => setNewTest({ ...newTest, winner_criteria: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WINNER_CRITERIA_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Variantes</Label>
              {newTest.variants.map((variant, index) => (
                <Card key={variant.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {variant.id.toUpperCase()}
                    </Badge>
                    <Input 
                      placeholder={`Variante ${variant.id.toUpperCase()}`}
                      value={variant.name}
                      onChange={(e) => {
                        const variants = [...newTest.variants]
                        variants[index] = { ...variant, name: e.target.value }
                        setNewTest({ ...newTest, variants })
                      }}
                      className="flex-1"
                    />
                    {newTest.test_type === 'subject' && (
                      <Input 
                        placeholder="Objet de l'email"
                        value={variant.subject || ''}
                        onChange={(e) => {
                          const variants = [...newTest.variants]
                          variants[index] = { ...variant, subject: e.target.value }
                          setNewTest({ ...newTest, variants })
                        }}
                        className="flex-1"
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!newTest.name}>
              Créer le test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Résultats: {selectedTest?.name}</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="py-4 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {selectedTest.variants.map((variant) => (
                  <VariantResultCard 
                    key={variant.id}
                    variant={variant}
                    isWinner={selectedTest.winner_variant === variant.id}
                    winnerCriteria={selectedTest.winner_criteria}
                  />
                ))}
              </div>
              {selectedTest.status === 'running' && (
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => selectWinner({ id: selectedTest.id, winnerId: 'a' })}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Choisir A comme gagnant
                  </Button>
                  <Button 
                    onClick={() => selectWinner({ id: selectedTest.id, winnerId: 'b' })}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Choisir B comme gagnant
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ABTestCardProps {
  test: CampaignABTest
  onStart: () => void
  onViewResults: () => void
  onSelectWinner: (winnerId: string) => void
  onDelete: () => void
  suggestedWinner: string | null
}

function ABTestCard({ test, onStart, onViewResults, onSelectWinner, onDelete, suggestedWinner }: ABTestCardProps) {
  const statusVariant = test.status === 'running' ? 'default' : 
                        test.status === 'completed' ? 'secondary' : 'outline'
  const statusLabel = test.status === 'running' ? 'En cours' :
                      test.status === 'completed' ? 'Terminé' : 'Brouillon'

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{test.name}</h4>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              {test.winner_variant && (
                <Badge variant="default" className="bg-yellow-500">
                  <Trophy className="h-3 w-3 mr-1" />
                  Gagnant: {test.winner_variant.toUpperCase()}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {TEST_TYPE_LABELS[test.test_type]} • {WINNER_CRITERIA_LABELS[test.winner_criteria]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {test.status === 'running' && (
            <div className="flex gap-2">
              {test.variants.map(v => (
                <div key={v.id} className="text-center px-3">
                  <p className="text-xs text-muted-foreground">Var. {v.id.toUpperCase()}</p>
                  <p className="font-semibold">{v.sent > 0 ? ((v.opened / v.sent) * 100).toFixed(1) : 0}%</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {test.status === 'draft' && (
              <Button size="sm" onClick={onStart}>
                <Play className="h-4 w-4 mr-1" />
                Démarrer
              </Button>
            )}
            {test.status !== 'draft' && (
              <Button size="sm" variant="outline" onClick={onViewResults}>
                <BarChart3 className="h-4 w-4 mr-1" />
                Résultats
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface VariantResultCardProps {
  variant: ABTestVariant
  isWinner: boolean
  winnerCriteria: string
}

function VariantResultCard({ variant, isWinner, winnerCriteria }: VariantResultCardProps) {
  const openRate = variant.sent > 0 ? (variant.opened / variant.sent) * 100 : 0
  const clickRate = variant.opened > 0 ? (variant.clicked / variant.opened) * 100 : 0
  const conversionRate = variant.clicked > 0 ? (variant.converted / variant.clicked) * 100 : 0

  return (
    <Card className={`p-4 ${isWinner ? 'ring-2 ring-yellow-500' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <Badge variant={isWinner ? 'default' : 'secondary'} className={isWinner ? 'bg-yellow-500' : ''}>
          {isWinner && <Trophy className="h-3 w-3 mr-1" />}
          Variante {variant.id.toUpperCase()}
        </Badge>
        <span className="text-sm text-muted-foreground">{variant.name}</span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Taux d'ouverture</span>
            <span className={winnerCriteria === 'open_rate' ? 'font-bold' : ''}>{openRate.toFixed(1)}%</span>
          </div>
          <Progress value={openRate} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Taux de clic</span>
            <span className={winnerCriteria === 'click_rate' ? 'font-bold' : ''}>{clickRate.toFixed(1)}%</span>
          </div>
          <Progress value={clickRate} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Taux de conversion</span>
            <span className={winnerCriteria === 'conversion_rate' ? 'font-bold' : ''}>{conversionRate.toFixed(1)}%</span>
          </div>
          <Progress value={conversionRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t">
          <div>
            <p className="text-lg font-bold">{variant.sent}</p>
            <p className="text-xs text-muted-foreground">Envoyés</p>
          </div>
          <div>
            <p className="text-lg font-bold">{variant.converted}</p>
            <p className="text-xs text-muted-foreground">Convertis</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
