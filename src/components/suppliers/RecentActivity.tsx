import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, AlertCircle, RefreshCw, Upload } from 'lucide-react'

export function RecentActivity() {
  const activities = [
    {
      id: '1',
      type: 'sync',
      title: 'Synchronisation réussie',
      supplier: 'Spocket',
      time: 'Il y a 5 min',
      status: 'success',
      icon: CheckCircle
    },
    {
      id: '2',
      type: 'import',
      title: 'Import de 245 produits',
      supplier: 'BigBuy',
      time: 'Il y a 1h',
      status: 'success',
      icon: Upload
    },
    {
      id: '3',
      type: 'error',
      title: 'Erreur de connexion',
      supplier: 'AliExpress',
      time: 'Il y a 2h',
      status: 'error',
      icon: AlertCircle
    },
    {
      id: '4',
      type: 'sync',
      title: 'Mise à jour des prix',
      supplier: 'CJ Dropshipping',
      time: 'Il y a 3h',
      status: 'success',
      icon: RefreshCw
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  activity.status === 'success' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.supplier}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
