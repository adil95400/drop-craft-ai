import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface MetricProps {
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  trend?: 'up' | 'down'
  description?: string
  className?: string
}

export function DashboardMetric({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  gradient, 
  trend = 'up', 
  description,
  className = ""
}: MetricProps) {
  return (
    <Card className={`relative overflow-hidden hover:shadow-xl transition-all duration-500 animate-fade-in border-0 shadow-lg hover-scale group ${className}`}>
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      {/* Animated Border Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`} />
      
      <CardContent className="p-6 relative">
        {/* Header with Icon and Change */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transform group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          {change !== undefined && (
            <Badge 
              variant={trend === 'up' ? 'default' : 'destructive'}
              className={`${trend === 'up' 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
              } border-0 font-medium px-3 py-1`}
            >
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform origin-left">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
              {description}
            </p>
          )}
        </div>
        
        {/* Animated Progress Bar */}
        {change && (
          <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out group-hover:animate-pulse`}
              style={{ width: `${Math.min(Math.abs(change) * 2, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MetricsGrid({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  )
}