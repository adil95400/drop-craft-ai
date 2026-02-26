import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Plus, Settings, Trash2, Play, Pause } from 'lucide-react'
import { AdvancedFeatureGuide } from '@/components/guide'
import { ADVANCED_GUIDES } from '@/components/guide'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface FulfillmentRule {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  conditions: any;
  actions: any;
  created_at: string;
}

export default function FulfillmentRulesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: rules, isLoading } = useQuery({
    queryKey: ['fulfillment-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fulfilment_rules')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return (data || []) as FulfillmentRule[]
    },
  })

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('fulfilment_rules')
        .update({ is_active })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-rules'] })
      toast({ title: '✅ Règle mise à jour', description: 'Le statut de la règle a été modifié' })
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de modifier la règle', variant: 'destructive' })
    },
  })

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fulfilment_rules')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-rules'] })
      toast({ title: '✅ Règle supprimée', description: 'La règle a été supprimée avec succès' })
    },
  })

  return (
    <ChannablePageWrapper
      title="Règles d'automatisation"
      description="Configurez les règles de fulfillment automatique"
      heroImage="automation"
      badge={{ label: 'Fulfillment', icon: Settings }}
      actions={
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle règle
        </Button>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.fulfillment} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Règles actives</p>
              <p className="text-2xl font-bold">{rules?.filter(r => r.is_active).length || 0}</p>
            </div>
            <Play className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Règles inactives</p>
              <p className="text-2xl font-bold">{rules?.filter(r => !r.is_active).length || 0}</p>
            </div>
            <Pause className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total règles</p>
              <p className="text-2xl font-bold">{rules?.length || 0}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : rules?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Aucune règle d'automatisation configurée</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer votre première règle
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la règle</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rule.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) =>
                        toggleRuleMutation.mutate({ id: rule.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteRuleMutation.mutate(rule.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </ChannablePageWrapper>
  )
}
