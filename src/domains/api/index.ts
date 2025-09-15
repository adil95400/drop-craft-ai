// Export central des composants API
export { DeveloperConsole } from './components/DeveloperConsole'

// Types
export interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsed: string
  created: string
  status: 'active' | 'revoked'
  usage: {
    requests: number
    limit: number
    period: string
  }
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  status: 'active' | 'inactive'
  lastDelivery: string
  successRate: number
}

export interface APIEndpoint {
  method: string
  path: string
  description: string
  parameters?: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  example?: string
}