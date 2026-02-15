import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Bot, Zap, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export const RefundAutomation = () => {
  const { toast } = useToast()
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState([75])
  const [maxAutoAmount, setMaxAutoAmount] = useState(500)

  const { data: automationStats } = useQuery({
    queryKey: ['refund-automation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'refund_processed')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const total = data?.length || 0
      const successful = data?.filter((log: any) => log.severity !== 'error').length || 0
      const avgTime = 0

      return {
        total_processed: total,
        auto_approved: successful,
        approval_rate: total > 0 ? (successful / total) * 100 : 0,
        avg_processing_time: avgTime,
        manual_review: total - successful
      }
    }
  })

  const processRefundMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('refund-automation-processor', {
        body: {
          order_id: orderId,
          refund_reason: 'customer_request',
          auto_approve: autoApproveEnabled,
          confidence_threshold: confidenceThreshold[0] / 100
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: data.auto_approved ? "Remboursement approuvé automatiquement" : "Révision manuelle requise",
        description: data.message,
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de traiter le remboursement",
        variant: "destructive"
      })
    }
  })

  const { data: recentProcessing } = useQuery({
    queryKey: ['recent-refund-processing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'refund_processed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    }
  })

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Automatisation IA des Remboursements</h3>
            <p className="text-sm text-muted-foreground">
              Configuration du système d'approbation automatique
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">Approbation automatique</Label>
              <p className="text-sm text-muted-foreground">
                Approuver automatiquement les remboursements éligibles
              </p>
            </div>
            <Switch
              checked={autoApproveEnabled}
              onCheckedChange={setAutoApproveEnabled}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seuil de confiance minimum: {confidenceThreshold[0]}%</Label>
              <Slider
                value={confidenceThreshold}
                onValueChange={setConfidenceThreshold}
                min={50}
                max={100}
                step={5}
                disabled={!autoApproveEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Les remboursements avec un score de confiance supérieur seront approuvés automatiquement
              </p>
            </div>

            <div className="space-y-2">
              <Label>Montant maximum pour auto-approbation</Label>
              <Select
                value={maxAutoAmount.toString()}
                onValueChange={(value) => setMaxAutoAmount(parseInt(value))}
                disabled={!autoApproveEnabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100€</SelectItem>
                  <SelectItem value="250">250€</SelectItem>
                  <SelectItem value="500">500€</SelectItem>
                  <SelectItem value="1000">1000€</SelectItem>
                  <SelectItem value="5000">5000€</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Traités</p>
              <p className="text-2xl font-bold">{automationStats?.total_processed || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Auto-approuvés</p>
              <p className="text-2xl font-bold">{automationStats?.auto_approved || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Taux d'approbation</p>
              <p className="text-2xl font-bold">{automationStats?.approval_rate.toFixed(1) || 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Révision manuelle</p>
              <p className="text-2xl font-bold">{automationStats?.manual_review || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Traitements récents</h3>
        <div className="space-y-3">
          {recentProcessing?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun traitement récent</p>
          ) : (
          recentProcessing?.map((item) => {
            const meta = (item.details as any) || {}
            return (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Commande {meta.order_number || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                      {meta.customer_name} - {meta.refund_amount}€
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={meta.auto_approved ? "default" : "outline"}>
                      {meta.auto_approved ? "Auto-approuvé" : "Révision manuelle"}
                    </Badge>
                    {meta.confidence_score && (
                      <div className="flex items-center gap-2">
                        <Progress value={meta.confidence_score * 100} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {(meta.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
