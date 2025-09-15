// Export central des composants Enterprise
export { OrganizationManager } from './components/OrganizationManager'

// Types
export interface Organization {
  id: string
  name: string
  domain: string
  plan: 'starter' | 'pro' | 'enterprise'
  status: 'active' | 'suspended' | 'trial'
  members_count: number
  created_at: string
  settings: {
    branding?: {
      logo?: string
      primary_color?: string
      secondary_color?: string
    }
    features?: string[]
    limits?: {
      users?: number
      products?: number
      api_calls?: number
    }
  }
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'member'
  status: 'active' | 'pending' | 'inactive'
  last_active: string
}