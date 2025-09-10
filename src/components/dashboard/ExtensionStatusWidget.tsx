import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Puzzle, 
  TrendingUp, 
  Download, 
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ExtensionStats {
  totalExtensions: number
  installedExtensions: number
  activeExtensions: number
  monthlyDownloads: number
  lastSync: string
}

const mockStats: ExtensionStats = {
  totalExtensions: 250,
  installedExtensions: 5,
  activeExtensions: 3,
  monthlyDownloads: 1250,
  lastSync: '2024-01-16T10:30:00Z'
}

export const ExtensionStatusWidget: React.FC = () => {
  const navigate = useNavigate()
  const stats = mockStats

  const usagePercentage = (stats.installedExtensions / stats.totalExtensions) * 100

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Extensions</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.activeExtensions} actives
          </Badge>
        </div>
        <CardDescription>
          Système d'extensions et marketplace
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{stats.installedExtensions}</div>
            <div className="text-xs text-muted-foreground">Installées</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">{stats.totalExtensions}</div>
            <div className="text-xs text-muted-foreground">Disponibles</div>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Adoption</span>
            <span className="font-medium">{Math.round(usagePercentage)}%</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>

        {/* Extension Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Extension Navigateur</span>
            </div>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Connectée
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span>Gestionnaire d'Impression</span>
            </div>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
              Configurer
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Download className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {stats.monthlyDownloads.toLocaleString()} téléchargements ce mois
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">
              +15% par rapport au mois dernier
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => navigate('/extensions/marketplace')}
          >
            <span>Parcourir le Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/extensions')}
          >
            Gérer mes extensions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ExtensionStatusWidget