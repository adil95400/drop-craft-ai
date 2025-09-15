import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2, 
  Users, 
  Crown, 
  Settings, 
  Plus,
  Edit3,
  Trash2,
  Mail,
  Shield,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Organization {
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

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'member'
  status: 'active' | 'pending' | 'inactive'
  last_active: string
}

export function OrganizationManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Mock data pour la démo
  useEffect(() => {
    const mockOrganizations: Organization[] = [
      {
        id: '1',
        name: 'TechCorp Solutions',
        domain: 'techcorp.com',
        plan: 'enterprise',
        status: 'active',
        members_count: 25,
        created_at: '2024-01-15T00:00:00Z',
        settings: {
          branding: {
            logo: '/api/placeholder/150/50',
            primary_color: '#2563eb',
            secondary_color: '#64748b'
          },
          features: ['ai_assistant', 'marketplace_sync', 'advanced_analytics'],
          limits: { users: 100, products: 50000, api_calls: 100000 }
        }
      },
      {
        id: '2',
        name: 'E-Commerce Plus',
        domain: 'ecommerceplus.net',
        plan: 'pro',
        status: 'active',
        members_count: 8,
        created_at: '2024-02-20T00:00:00Z',
        settings: {
          features: ['marketplace_sync', 'basic_analytics'],
          limits: { users: 25, products: 10000, api_calls: 25000 }
        }
      },
      {
        id: '3',
        name: 'Startup Demo',
        domain: 'startupdemo.io',
        plan: 'starter',
        status: 'trial',
        members_count: 3,
        created_at: '2024-03-10T00:00:00Z',
        settings: {
          features: ['basic_features'],
          limits: { users: 5, products: 1000, api_calls: 5000 }
        }
      }
    ]

    const mockTeamMembers: TeamMember[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@techcorp.com',
        role: 'owner',
        status: 'active',
        last_active: '2024-03-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Mike Chen',
        email: 'mike@techcorp.com',
        role: 'admin',
        status: 'active',
        last_active: '2024-03-15T09:15:00Z'
      },
      {
        id: '3',
        name: 'Emma Davis',
        email: 'emma@techcorp.com',
        role: 'manager',
        status: 'pending',
        last_active: '2024-03-14T16:45:00Z'
      }
    ]

    setOrganizations(mockOrganizations)
    setSelectedOrg(mockOrganizations[0])
    setTeamMembers(mockTeamMembers)
    setLoading(false)
  }, [])

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-gradient-to-r from-purple-500 to-purple-600'
      case 'pro': return 'bg-gradient-to-r from-blue-500 to-blue-600'
      default: return 'bg-gradient-to-r from-green-500 to-green-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'trial': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />
      default: return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const createOrganization = async (data: any) => {
    try {
      // Simulation création
      toast({
        title: "Organisation créée",
        description: `${data.name} a été créée avec succès`,
      })
      setShowCreateDialog(false)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'organisation",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Organisations</h1>
          <p className="text-muted-foreground">
            Gérez vos organisations, équipes et paramètres enterprise
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Organisation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle organisation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Nom de l'organisation</Label>
                <Input id="orgName" placeholder="Mon Entreprise" />
              </div>
              <div>
                <Label htmlFor="orgDomain">Domaine</Label>
                <Input id="orgDomain" placeholder="monentreprise.com" />
              </div>
              <div>
                <Label htmlFor="orgPlan">Plan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter - 29€/mois</SelectItem>
                    <SelectItem value="pro">Pro - 99€/mois</SelectItem>
                    <SelectItem value="enterprise">Enterprise - Sur mesure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createOrganization({})} className="w-full">
                Créer l'organisation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <Card 
            key={org.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedOrg?.id === org.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedOrg(org)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <Building2 className="h-8 w-8 text-primary" />
                <Badge className={getStatusColor(org.status)}>
                  {org.status}
                </Badge>
              </div>
              <CardTitle className="text-lg">{org.name}</CardTitle>
              <CardDescription>{org.domain}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium text-white ${getPlanColor(org.plan)}`}>
                  {org.plan.toUpperCase()}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  {org.members_count} membres
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Créée le {new Date(org.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organization Details */}
      {selectedOrg && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              {selectedOrg.name}
            </CardTitle>
            <CardDescription>
              Gérez les paramètres et l'équipe de cette organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="team">Équipe</TabsTrigger>
                <TabsTrigger value="settings">Paramètres</TabsTrigger>
                <TabsTrigger value="billing">Facturation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Membres</p>
                          <p className="text-lg font-semibold">{selectedOrg.members_count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Produits</p>
                          <p className="text-lg font-semibold">{selectedOrg.settings.limits?.products?.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Plan</p>
                          <p className="text-lg font-semibold capitalize">{selectedOrg.plan}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Fonctionnalités activées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrg.settings.features?.map((feature) => (
                        <Badge key={feature} variant="secondary">
                          {feature.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="team" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Membres de l'équipe</h3>
                  <Button size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Inviter un membre
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <p className="font-medium">{member.name}</p>
                                {getRoleIcon(member.role)}
                              </div>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(member.status)}>
                              {member.status}
                            </Badge>
                            <Badge variant="outline">
                              {member.role}
                            </Badge>
                            <Button size="sm" variant="ghost">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personnalisation de la marque</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Logo de l'organisation</Label>
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <Button variant="outline">Changer le logo</Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Couleur primaire</Label>
                        <div className="mt-2 flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded border" 
                            style={{ backgroundColor: selectedOrg.settings.branding?.primary_color }}
                          />
                          <Input 
                            value={selectedOrg.settings.branding?.primary_color || '#2563eb'} 
                            readOnly
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Couleur secondaire</Label>
                        <div className="mt-2 flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded border" 
                            style={{ backgroundColor: selectedOrg.settings.branding?.secondary_color }}
                          />
                          <Input 
                            value={selectedOrg.settings.branding?.secondary_color || '#64748b'} 
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button>Sauvegarder les modifications</Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="billing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de facturation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Plan actuel</Label>
                        <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-sm font-medium text-white ${getPlanColor(selectedOrg.plan)}`}>
                          {selectedOrg.plan.toUpperCase()}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Prochaine facturation</Label>
                        <p className="mt-2 text-sm">15 avril 2024</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Limites du plan</Label>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Utilisateurs</p>
                          <p className="font-medium">{selectedOrg.settings.limits?.users}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Produits</p>
                          <p className="font-medium">{selectedOrg.settings.limits?.products?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Appels API</p>
                          <p className="font-medium">{selectedOrg.settings.limits?.api_calls?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button>Changer de plan</Button>
                      <Button variant="outline">Voir l'historique</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}