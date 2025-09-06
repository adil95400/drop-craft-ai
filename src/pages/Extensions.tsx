import React from 'react'
import { EnhancedIntegrationsHub } from '@/components/integrations/EnhancedIntegrationsHub'

export default function Extensions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="container mx-auto p-6">
        <EnhancedIntegrationsHub />
      </div>
    </div>
  )
}