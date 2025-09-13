import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, AlertTriangle, Brain, Zap } from 'lucide-react'

interface AIInsightProps {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  estimated: string
  type: 'optimization' | 'alert' | 'recommendation' | 'opportunity'
  onApply?: () => void
  className?: string
}

export function AIInsightCard({
  title,
  description,
  impact,
  estimated,
  type,
  onApply,
  className = ""
}: AIInsightProps) {
  
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'optimization':
        return {
          icon: TrendingUp,
          gradient: 'from-green-500 to-emerald-600',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        }
      case 'alert':
        return {
          icon: AlertTriangle,
          gradient: 'from-red-500 to-orange-600',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        }
      case 'recommendation':
        return {
          icon: Brain,
          gradient: 'from-purple-500 to-pink-600',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200'
        }
      default:
        return {
          icon: Zap,
          gradient: 'from-blue-500 to-cyan-600',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        }
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const config = getTypeConfig(type)
  const Icon = config.icon

  return (
    <Card className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 hover-scale group ${className}`}>
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-all duration-500`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                {title}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={`mt-1 text-xs ${getImpactColor(impact)} border`}
              >
                Impact {impact}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-xs text-gray-600 mb-3 leading-relaxed group-hover:text-gray-800 transition-colors">
          {description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="text-xs">
            <span className="text-gray-500">Estimation:</span>
            <div className={`font-semibold ${config.textColor} text-sm`}>
              {estimated}
            </div>
          </div>
          
          {onApply && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onApply}
              className="h-7 px-3 text-xs hover:shadow-md transition-all duration-200 hover-scale"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Appliquer
            </Button>
          )}
        </div>
        
        {/* Progress indicator for impact */}
        <div className="mt-3 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-1000 ease-out`}
            style={{ 
              width: impact === 'high' ? '90%' : impact === 'medium' ? '60%' : '30%' 
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function AIInsightsSection({ 
  insights, 
  className = "" 
}: { 
  insights: any[]
  className?: string 
}) {
  return (
    <Card className={`border-0 shadow-lg animate-fade-in ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Suggestions AI ShopOpti+
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Optimisations personnalisées basées sur vos données
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <AIInsightCard
              key={index}
              title={insight.title}
              description={insight.description}
              impact={insight.impact}
              estimated={insight.estimated}
              type={insight.type}
              onApply={insight.onApply}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}