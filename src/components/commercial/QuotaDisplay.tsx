import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuotas } from '@/hooks/useQuotas'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const quotaLabels: Record<string, string> = {
  products: 'Produits',
  suppliers: 'Fournisseurs', 
  orders: 'Commandes',
  exports: 'Exports',
  ai_analysis: 'Analyses IA',
  automations: 'Automations',
  white_label: 'White Label'
}

const quotaDescriptions: Record<string, string> = {
  products: 'Nombre de produits que vous pouvez gérer',
  suppliers: 'Nombre de fournisseurs connectés',
  orders: 'Commandes mensuelles',
  exports: 'Exports de données par mois',
  ai_analysis: 'Analyses IA par mois',
  automations: 'Workflows d\'automatisation actifs',
  white_label: 'Personnalisation de la marque'
}

export function QuotaDisplay() {
  const { quotas, loading, error } = useQuotas()
  const navigate = useNavigate()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quotas d'utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-2 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Erreur de quotas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (quotas.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Quotas d'utilisation
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pricing')}
          >
            Améliorer le plan
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {quotas.map((quota) => {
            const isUnlimited = quota.limit_value === -1
            const isNearLimit = !isUnlimited && Number(quota.percentage_used) >= 80
            const isAtLimit = !isUnlimited && Number(quota.percentage_used) >= 100
            
            return (
              <div key={quota.quota_key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {quotaLabels[quota.quota_key] || quota.quota_key}
                      </span>
                      {isUnlimited ? (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Illimité
                        </Badge>
                      ) : isAtLimit ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Limite atteinte
                        </Badge>
                      ) : isNearLimit ? (
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Bientôt plein
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {quotaDescriptions[quota.quota_key] || 'Usage mensuel'}
                    </p>
                  </div>
                  
                  <div className="text-right text-sm">
                    {isUnlimited ? (
                      <span className="text-muted-foreground">∞</span>
                    ) : (
                      <span className={isAtLimit ? 'text-destructive font-medium' : ''}>
                        {quota.current_count} / {quota.limit_value}
                      </span>
                    )}
                  </div>
                </div>
                
                {!isUnlimited && (
                  <Progress
                    value={Math.min(Number(quota.percentage_used), 100)}
                    className="h-2"
                  />
                )}
                
                {!isUnlimited && quota.reset_date && (
                  <p className="text-xs text-muted-foreground">
                    Réinitialisation : {new Date(quota.reset_date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            )
          })}
          
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pricing')}
              className="w-full"
            >
              Voir tous les plans →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}