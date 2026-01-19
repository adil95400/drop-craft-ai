import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { toast } from 'sonner'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Crown, 
  MoreHorizontal, 
  Mail,
  Activity
} from 'lucide-react'

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'pending' | 'suspended'
  avatar_url?: string
  last_active?: string
  joined_at: string
  permissions: string[]
}

const TeamManagement = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
    message: ''
  })

  useEffect(() => {
    if (user?.id) {
      loadTeamMembers()
    }
  }, [user?.id])

  const loadTeamMembers = async () => {
    try {
      const mockTeamMembers: TeamMember[] = [
        {
          id: user?.id || '1',
          full_name: 'Vous',
          email: user?.email || 'admin@company.com',
          role: 'admin',
          status: 'active',
          avatar_url: '',
          last_active: 'En ligne',
          joined_at: '2023-01-15T10:00:00Z',
          permissions: ['all']
        },
        {
          id: '2',
          full_name: 'Marie Dubois',
          email: 'marie@company.com',
          role: 'editor',
          status: 'active',
          avatar_url: '',
          last_active: '2024-01-20T14:30:00Z',
          joined_at: '2023-06-01T09:00:00Z',
          permissions: ['products', 'orders', 'customers']
        },
        {
          id: '3',
          full_name: 'Jean Martin',
          email: 'jean@company.com',
          role: 'viewer',
          status: 'active',
          avatar_url: '',
          last_active: '2024-01-19T16:45:00Z',
          joined_at: '2023-09-15T11:20:00Z',
          permissions: ['orders', 'customers']
        },
        {
          id: '4',
          full_name: 'Sophie Laurent',
          email: 'sophie@company.com',
          role: 'editor',
          status: 'pending',
          avatar_url: '',
          last_active: undefined,
          joined_at: '2024-01-20T08:00:00Z',
          permissions: ['products', 'marketing']
        }
      ]

      setTeamMembers(mockTeamMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
      toast.error('Erreur lors du chargement de l\'équipe')
    }
  }

  const sendInvite = async () => {
    setLoading(true)
    try {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        full_name: inviteForm.email.split('@')[0],
        email: inviteForm.email,
        role: inviteForm.role,
        status: 'pending',
        joined_at: new Date().toISOString(),
        permissions: getDefaultPermissions(inviteForm.role)
      }

      setTeamMembers(prev => [...prev, newMember])
      setShowInviteDialog(false)
      setInviteForm({ email: '', role: 'viewer', message: '' })
      
      toast.success('Invitation envoyée avec succès')
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error('Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      setTeamMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole, permissions: getDefaultPermissions(newRole) }
          : member
      ))
      
      toast.success('Rôle mis à jour avec succès')
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Erreur lors de la mise à jour du rôle')
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      setTeamMembers(prev => prev.filter(member => member.id !== memberId))
      toast.success('Membre supprimé de l\'équipe')
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['all']
      case 'editor':
        return ['products', 'orders', 'customers', 'marketing']
      case 'viewer':
        return ['orders', 'customers']
      default:
        return []
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'editor':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800'
      case 'editor':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLastActive = (lastActive: string | undefined) => {
    if (!lastActive) return 'Jamais'
    if (lastActive === 'En ligne') return lastActive
    
    const date = new Date(lastActive)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Il y a quelques minutes'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <ChannablePageWrapper
      title="Gestion d'équipe"
      subtitle="Collaboration"
      description="Gérez les membres de votre équipe et leurs permissions d'accès."
      heroImage="settings"
      badge={{ label: `${teamMembers.length} membres`, icon: Users }}
      actions={
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Inviter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau membre</DialogTitle>
              <DialogDescription>
                Invitez une personne à rejoindre votre équipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Adresse email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <Select 
                  value={inviteForm.role} 
                  onValueChange={(value: 'admin' | 'editor' | 'viewer') => 
                    setInviteForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualiseur - Lecture seule</SelectItem>
                    <SelectItem value="editor">Éditeur - Peut modifier</SelectItem>
                    <SelectItem value="admin">Admin - Tous les droits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-message">Message personnalisé (optionnel)</Label>
                <Input
                  id="invite-message"
                  placeholder="Rejoins notre équipe !"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={sendInvite} disabled={loading || !inviteForm.email}>
                  Envoyer l'invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-sm text-muted-foreground">Membres total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.role === 'admin').length}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membres de l'équipe</CardTitle>
          <CardDescription>
            Liste de tous les membres de votre équipe et leurs rôles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Rejoint le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <Badge className={getRoleColor(member.role)}>
                        {member.role === 'admin' ? 'Admin' : 
                         member.role === 'editor' ? 'Éditeur' : 'Visualiseur'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status === 'active' ? 'Actif' :
                       member.status === 'pending' ? 'En attente' : 'Suspendu'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatLastActive(member.last_active)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.id !== user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                            Promouvoir Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'editor')}>
                            Définir comme Éditeur
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'viewer')}>
                            Définir comme Visualiseur
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => removeMember(member.id)}
                          >
                            Supprimer de l'équipe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions par rôle</CardTitle>
          <CardDescription>
            Aperçu des permissions accordées à chaque rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold">Administrateur</h3>
              </div>
              <ul className="space-y-1 text-sm">
                <li>• Accès complet à toutes les fonctionnalités</li>
                <li>• Gestion de l'équipe</li>
                <li>• Configuration du compte</li>
                <li>• Accès aux données sensibles</li>
                <li>• Gestion des intégrations</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Éditeur</h3>
              </div>
              <ul className="space-y-1 text-sm">
                <li>• Gestion des produits</li>
                <li>• Traitement des commandes</li>
                <li>• Gestion des clients</li>
                <li>• Campagnes marketing</li>
                <li>• Rapports de base</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold">Visualiseur</h3>
              </div>
              <ul className="space-y-1 text-sm">
                <li>• Consultation des commandes</li>
                <li>• Consultation des clients</li>
                <li>• Rapports en lecture seule</li>
                <li>• Accès au tableau de bord</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  )
}

export default TeamManagement
