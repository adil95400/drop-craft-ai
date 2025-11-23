import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Info, Clock } from 'lucide-react'

export const ApplicationStatus = () => {
  const phases = [
    {
      id: 1,
      name: 'Phase 1: Infrastructure & Base',
      status: 'completed',
      description: 'Auth, DB, UI components, routing',
      completion: 100
    },
    {
      id: 2,
      name: 'Phase 2: Core Modules',
      status: 'completed',
      description: 'Products, Suppliers, Import, Marketing',
      completion: 100
    },
    {
      id: 3,
      name: 'Phase 3: Intelligence & AI',
      status: 'completed',
      description: 'AI optimization, analytics, automation',
      completion: 100
    },
    {
      id: 4,
      name: 'Phase 4: Extensions & Marketplace',
      status: 'completed',
      description: 'Extension system, developer tools',
      completion: 100
    },
    {
      id: 5,
      name: 'Phase 5: Go-to-Market',
      status: 'completed',
      description: 'Marketing tools, sales enablement',
      completion: 100
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">En attente</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const overallProgress = phases.reduce((acc, phase) => acc + phase.completion, 0) / phases.length

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            État de l'Application - ShopOpti
          </CardTitle>
          <CardDescription>
            Suivi du développement et des fonctionnalités implémentées
          </CardDescription>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression globale</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {phases.map((phase) => (
              <Card key={phase.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(phase.status)}
                      <CardTitle className="text-lg">{phase.name}</CardTitle>
                    </div>
                    {getStatusBadge(phase.status)}
                  </div>
                  <CardDescription>{phase.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all" 
                      style={{ width: `${phase.completion}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {phase.completion}% terminé
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Application Prête pour Production</h3>
            </div>
            <p className="text-green-700 text-sm">
              Toutes les phases de développement sont terminées. L'application ShopOpti est 
              entièrement fonctionnelle avec tous les composants TypeScript corrigés et optimisés.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}