import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Plus, Settings, Trash2, Play, Pause } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Database } from '@/integrations/supabase/types'

type FulfillmentRule = Database['public']['Tables']['fulfillment_automation_rules']['Row']

export default function FulfillmentRulesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: rules, isLoading } = useQuery({
    queryKey: ['fulfillment-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fulfillment_automation_rules')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as FulfillmentRule[]
    },
  })

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('fulfillment_automation_rules')
        .update({ is_active })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-rules'] })
      toast({
        title: '✅ Règle mise à jour',
        description: 'Le statut de la règle a été modifié',
      })
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la règle',
        variant: 'destructive',
      })
    },
  })

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fulfillment_automation_rules')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-rules'] })
      toast({
        title: '✅ Règle supprimée',
        description: 'La règle a été supprimée avec succès',
      })
    },
  })

  const getTriggerBadge = (trigger: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-500/10 text-green-500',
      confirmed: 'bg-blue-500/10 text-blue-500',
      processing: 'bg-yellow-500/10 text-yellow-500',
    }
    return colors[trigger] || 'bg-muted'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Règles d'automatisation</h1>
          <p className="text-muted-foreground">
            Configurez les règles de fulfillment automatique
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Règles actives</p>
              <p className="text-2xl font-bold">
                {rules?.filter(r => r.is_active).length || 0}
              </p>
            </div>
            <Play className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Règles inactives</p>
              <p className="text-2xl font-bold">
                {rules?.filter(r => !r.is_active).length || 0}
              </p>
            </div>
            <Pause className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total exécutions</p>
              <p className="text-2xl font-bold">
                {rules?.reduce((sum, r) => sum + r.execution_count, 0) || 0}
              </p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement des règles...
          </div>
        ) : rules?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Aucune règle d'automatisation configurée
            </p>
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
                <TableHead>Déclenchement</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Actions auto</TableHead>
                <TableHead>Exécutions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge className={getTriggerBadge(rule.trigger_on)}>
                      {rule.trigger_on}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {rule.min_order_value && (
                        <span>Min: {rule.min_order_value}€</span>
                      )}
                      {rule.max_order_value && (
                        <span>Max: {rule.max_order_value}€</span>
                      )}
                      {rule.destination_countries && rule.destination_countries.length > 0 && (
                        <span>Pays: {rule.destination_countries.join(', ')}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {rule.auto_select_carrier && (
                        <Badge variant="secondary" className="text-xs">Auto transporteur</Badge>
                      )}
                      {rule.auto_generate_label && (
                        <Badge variant="secondary" className="text-xs">Étiquette</Badge>
                      )}
                      {rule.auto_send_tracking && (
                        <Badge variant="secondary" className="text-xs">Suivi</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{rule.execution_count}</TableCell>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                      >
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
    </div>
  )
}
