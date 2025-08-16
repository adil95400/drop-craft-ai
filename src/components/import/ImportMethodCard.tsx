import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, Eye, Settings, Loader2 } from 'lucide-react'

interface ImportMethodCardProps {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  logo: string
  isActive: boolean
  isConnected: boolean
  onTest: () => void
  onConfigure: () => void
  testLoading?: boolean
}

export const ImportMethodCard = ({
  id,
  title,
  description,
  icon,
  logo,
  isActive,
  isConnected,
  onTest,
  onConfigure,
  testLoading = false
}: ImportMethodCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{logo}</div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connecté
              </Badge>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Non configuré
              </Badge>
            </>
          )}
          {!isActive && (
            <Badge variant="outline" className="bg-gray-50 text-gray-600">
              Inactif
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onTest}
            disabled={testLoading}
          >
            {testLoading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 mr-1" />
            )}
            Tester
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onConfigure}
          >
            <Settings className="w-4 h-4 mr-1" />
            Configurer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}