import { useState } from 'react'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannablePageHero } from '@/components/channable/ChannablePageHero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAIAutoConfigs, useSaveAIAutoConfigs, useRunAIAutoActions, useAIAutoLogs, useRevertAIAction, AIAutoActionConfig } from '@/hooks/useAIAutoActions'
import { Bot, Play, Save, Undo2, Loader2, Zap, FileText, Tag, Search, Type } from 'lucide-react'

const ACTION_META: Record<string, { label: string; icon: any; description: string }> = {
  optimize_title: { label: 'Optimiser les titres', icon: Type, description: 'Enrichit les titres courts avec marque et catégorie' },
  optimize_description: { label: 'Enrichir les descriptions', icon: FileText, description: 'Complète les descriptions trop courtes' },
  generate_tags: { label: 'Générer des tags', icon: Tag, description: 'Ajoute automatiquement des tags pertinents' },
  fix_seo: { label: 'Corriger le SEO', icon: Search, description: 'Remplit les champs SEO manquants (title, meta)' },
}

export default function AIAutoActions() {
  const { data: configs, isLoading } = useAIAutoConfigs()
  const saveConfigs = useSaveAIAutoConfigs()
  const runActions = useRunAIAutoActions()
  const { data: logs } = useAIAutoLogs()
  const revertAction = useRevertAIAction()
  const [localConfigs, setLocalConfigs] = useState<AIAutoActionConfig[] | null>(null)

  const displayConfigs: AIAutoActionConfig[] = (localConfigs || configs || []) as AIAutoActionConfig[]

  const updateConfig = (actionType: string, updates: Partial<AIAutoActionConfig>) => {
    setLocalConfigs(prev => {
      const base = (prev || configs || []) as AIAutoActionConfig[]
      return base.map(c => c.action_type === actionType ? { ...c, ...updates } : c)
    })
  }

  return (
    <ChannablePageLayout>
      <ChannablePageHero
        title="IA Actionnable"
        description="Appliquez automatiquement les optimisations IA sur votre catalogue"
        category="ai"
      />

      <div className="px-6 py-6 space-y-6">
        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config"><Zap className="h-4 w-4 mr-1" />Configuration</TabsTrigger>
            <TabsTrigger value="logs"><FileText className="h-4 w-4 mr-1" />Historique ({logs?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Configurez les seuils et activez les actions automatiques</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => saveConfigs.mutate(displayConfigs)} disabled={saveConfigs.isPending}>
                  {saveConfigs.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder
                </Button>
                <Button onClick={() => runActions.mutate(undefined)} disabled={runActions.isPending}>
                  {runActions.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Exécuter maintenant
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayConfigs.map(config => {
                const meta = ACTION_META[config.action_type]
                if (!meta) return null
                const Icon = meta.icon
                return (
                  <Card key={config.action_type}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-sm">{meta.label}</CardTitle>
                        </div>
                        <Switch
                          checked={config.is_enabled}
                          onCheckedChange={(v) => updateConfig(config.action_type, { is_enabled: v })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium">Seuil de confiance : {config.threshold_score}%</label>
                        <Slider
                          value={[config.threshold_score]}
                          onValueChange={([v]) => updateConfig(config.action_type, { threshold_score: v })}
                          min={50} max={100} step={5}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-medium">Scope</label>
                          <Select value={config.scope} onValueChange={(v) => updateConfig(config.action_type, { scope: v })}>
                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous</SelectItem>
                              <SelectItem value="draft">Brouillons</SelectItem>
                              <SelectItem value="active">Actifs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium">Max/jour</label>
                          <Select value={String(config.max_daily_actions)} onValueChange={(v) => updateConfig(config.action_type, { max_daily_actions: Number(v) })}>
                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="250">250</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {config.actions_today !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Actions aujourd'hui : {config.actions_today}/{config.max_daily_actions}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardContent className="pt-4">
                <div className="rounded-md border max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Champ</TableHead>
                        <TableHead>Ancien</TableHead>
                        <TableHead>Nouveau</TableHead>
                        <TableHead>Confiance</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!logs || logs.length === 0) ? (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune action encore</TableCell></TableRow>
                      ) : logs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">{new Date(log.created_at).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{ACTION_META[log.action_type]?.label || log.action_type}</Badge></TableCell>
                          <TableCell className="text-xs">{log.field_name}</TableCell>
                          <TableCell className="text-xs max-w-[100px] truncate text-muted-foreground">{log.old_value || '—'}</TableCell>
                          <TableCell className="text-xs max-w-[100px] truncate">{log.new_value || '—'}</TableCell>
                          <TableCell className="text-xs">{log.confidence_score}%</TableCell>
                          <TableCell>
                            <Badge variant={log.status === 'applied' ? 'default' : log.status === 'reverted' ? 'secondary' : 'destructive'} className="text-xs">
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.status === 'applied' && (
                              <Button size="sm" variant="ghost" onClick={() => revertAction.mutate(log.id)} disabled={revertAction.isPending}>
                                <Undo2 className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ChannablePageLayout>
  )
}
