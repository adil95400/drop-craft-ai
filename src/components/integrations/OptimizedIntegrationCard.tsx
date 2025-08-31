import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-react'

interface Platform {
  id: string
  name: string
  logo: string
  category: string
  platform_type: string
}

interface OptimizedIntegrationCardProps {
  platform: Platform
  isConnected: boolean
  onClick: () => void
}

export const OptimizedIntegrationCard = memo(({ 
  platform, 
  isConnected, 
  onClick 
}: OptimizedIntegrationCardProps) => {
  return (
    <Card 
      className={`cursor-pointer hover:shadow-card transition-smooth border bg-card ${
        isConnected ? 'border-success/30 bg-success/5' : 'hover:border-primary/30'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center text-center space-y-3 relative">
        {isConnected && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
        )}
        <div className="w-16 h-16 flex items-center justify-center">
          <img 
            src={platform.logo} 
            alt={platform.name}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/80x40/6366f1/ffffff?text=${platform.name.charAt(0)}`
            }}
          />
        </div>
        <h3 className="font-medium text-sm text-foreground leading-tight">
          {platform.name}
        </h3>
        {isConnected && (
          <Badge className="bg-success/10 text-success border-success/20 text-xs">
            Connecté
          </Badge>
        )}
      </CardContent>
    </Card>
  )
})

OptimizedIntegrationCard.displayName = 'OptimizedIntegrationCard'