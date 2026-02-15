import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUnifiedQuotas } from '@/hooks/useUnifiedQuotas'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function QuotaDisplay() {
  const { getAllQuotas, isLoading } = useUnifiedQuotas()
  const navigate = useNavigate()
  const quotas = getAllQuotas()

  if (isLoading) {
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
            const isNearLimit = !quota.isUnlimited && quota.percentage >= 80
            const isAtLimit = !quota.isUnlimited && quota.percentage >= 100
            
            return (
              <div key={quota.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {quota.label}
                      </span>
                      {quota.isUnlimited ? (
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
                  </div>
                  
                  <div className="text-right text-sm">
                    {quota.isUnlimited ? (
                      <span className="text-muted-foreground">∞</span>
                    ) : (
                      <span className={isAtLimit ? 'text-destructive font-medium' : ''}>
                        {quota.current} / {quota.limit}
                      </span>
                    )}
                  </div>
                </div>
                
                {!quota.isUnlimited && (
                  <Progress
                    value={Math.min(quota.percentage, 100)}
                    className="h-2"
                  />
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
