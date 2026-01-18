/**
 * PAGE DE GESTION DES RÈGLES D'OPTIMISATION PRODUIT
 * Interface pour créer, éditer et gérer les règles d'automatisation catalogue
 */

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Pause, Trash2, Copy, Edit, TestTube } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ProductRule, RULE_TEMPLATES, RuleChannel } from '@/lib/rules/ruleTypes'
import { RuleBuilder } from '@/components/rules/RuleBuilder'
import { RuleTemplatesDialog } from '@/components/rules/RuleTemplatesDialog'
import { RuleTesterDialog } from '@/components/rules/RuleTesterDialog'

// Mapper DB → ProductRule
function mapDbToProductRule(dbRecord: any): ProductRule {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    description: dbRecord.description,
    enabled: dbRecord.enabled,
    priority: dbRecord.priority,
    channel: dbRecord.channel,
    conditionGroup: dbRecord.condition_group as any,
    actions: dbRecord.actions as any,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
    createdBy: dbRecord.created_by,
    executionCount: dbRecord.execution_count,
    successCount: dbRecord.success_count,
    errorCount: dbRecord.error_count,
    lastExecutedAt: dbRecord.last_executed_at,
    stopOnError: dbRecord.stop_on_error,
    skipIfAlreadyModified: dbRecord.skip_if_already_modified,
    logChanges: dbRecord.log_changes
  }
}

// Mapper ProductRule → DB
function mapProductRuleToDb(rule: Partial<ProductRule>): any {
  return {
    name: rule.name,
    description: rule.description,
    enabled: rule.enabled,
    priority: rule.priority,
    channel: rule.channel,
    condition_group: rule.conditionGroup,
    actions: rule.actions,
    created_by: rule.createdBy,
    execution_count: rule.executionCount,
    success_count: rule.successCount,
    error_count: rule.errorCount,
    last_executed_at: rule.lastExecutedAt,
    stop_on_error: rule.stopOnError,
    skip_if_already_modified: rule.skipIfAlreadyModified,
    log_changes: rule.logChanges
  }
}

export default function ProductRulesPage() {
  const [selectedRule, setSelectedRule] = useState<ProductRule | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showTester, setShowTester] = useState(false)
  const queryClient = useQueryClient()

  // Récupérer les règles
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['product-rules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await (supabase
        .from('pricing_rules') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })

      if (error) throw error
      return (data || []).map(mapDbToProductRule)
    }
  })

  // Toggle enabled/disabled
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase
        .from('pricing_rules') as any)
        .update({ is_active: enabled })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-rules'] })
      toast.success('Règle mise à jour')
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour de la règle')
      console.error(error)
    }
  })

  // Supprimer une règle
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('pricing_rules') as any)
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-rules'] })
      toast.success('Règle supprimée')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    }
  })

  // Dupliquer une règle
  const duplicateRuleMutation = useMutation({
    mutationFn: async (rule: ProductRule) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await (supabase
        .from('pricing_rules') as any)
        .insert({
          name: `${rule.name} (copie)`,
          description: rule.description,
          is_active: false,
          priority: rule.priority,
          conditions: rule.conditionGroup,
          actions: rule.actions,
          user_id: user.id
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-rules'] })
      toast.success('Règle dupliquée')
    }
  })

  const handleCreateFromTemplate = async (templateId: string) => {
    const template = RULE_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await (supabase
      .from('pricing_rules') as any)
      .insert({
        name: template.rule.name,
        description: template.rule.description,
        is_active: false,
        priority: template.rule.priority || 0,
        conditions: template.rule.conditionGroup,
        actions: template.rule.actions,
        user_id: user.id
      })

    if (error) {
      toast.error('Erreur lors de la création')
      return
    }

    queryClient.invalidateQueries({ queryKey: ['product-rules'] })
    toast.success('Règle créée depuis le template')
    setShowTemplates(false)
  }

  const getChannelBadgeColor = (channel: RuleChannel): string => {
    const colors: Record<RuleChannel, string> = {
      global: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
      google: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400',
      meta: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
      tiktok: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-400',
      amazon: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400',
      shopify: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400'
    }
    return colors[channel]
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Règles d'Optimisation</h1>
            <p className="text-muted-foreground">
              Automatisez l'optimisation de votre catalogue avec des règles intelligentes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplates(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button onClick={() => {
              setSelectedRule(null)
              setShowBuilder(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Règles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {rules.filter(r => r.enabled).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Désactivées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">
                {rules.filter(r => !r.enabled).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Exécutions (7j)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rules.reduce((sum, r) => sum + (r.executionCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des règles */}
        <Card>
          <CardHeader>
            <CardTitle>Mes Règles</CardTitle>
            <CardDescription>
              Les règles sont appliquées par ordre de priorité (1 = priorité maximale)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune règle configurée</p>
                <p className="text-sm mt-2">Créez votre première règle ou utilisez un template</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        P{rule.priority}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge className={getChannelBadgeColor(rule.channel)}>
                            {rule.channel}
                          </Badge>
                          {!rule.enabled && (
                            <Badge variant="outline" className="text-gray-500">
                              Désactivée
                            </Badge>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {rule.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>
                            {rule?.conditionGroup?.conditions?.length || 0} condition(s)
                          </span>
                          <span>
                            {rule?.actions?.length || 0} action(s)
                          </span>
                          {(rule.executionCount || 0) > 0 && (
                            <span>
                              {rule.executionCount} exécution(s) • {Math.round(((rule.successCount || 0) / (rule.executionCount || 1)) * 100)}% succès
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRule(rule)
                          setShowTester(true)
                        }}
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRuleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                      >
                        {rule.enabled ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRule(rule)
                          setShowBuilder(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateRuleMutation.mutate(rule)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Supprimer cette règle ?')) {
                            deleteRuleMutation.mutate(rule.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {showBuilder && (
        <RuleBuilder
          rule={selectedRule || undefined}
          open={showBuilder}
          onOpenChange={setShowBuilder}
          onSave={() => {
            setShowBuilder(false)
            queryClient.invalidateQueries({ queryKey: ['product-rules'] })
          }}
        />
      )}

      <RuleTemplatesDialog
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onSelectTemplate={handleCreateFromTemplate}
      />

      {selectedRule && (
        <RuleTesterDialog
          rule={selectedRule}
          open={showTester}
          onOpenChange={setShowTester}
        />
      )}
    </MainLayout>
  )
}