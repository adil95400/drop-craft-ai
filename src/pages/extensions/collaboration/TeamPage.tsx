import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, UserPlus, Crown, Shield, Eye, Settings, Mail, MoreVertical } from 'lucide-react'

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState('')

  const teamMembers = [
    {
      id: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      role: 'owner',
      avatar: '/api/placeholder/40/40',
      joinedAt: '2024-01-01',
      lastActive: '2024-01-15 16:30',
      permissions: ['read', 'write', 'deploy', 'admin']
    },
    {
      id: '2',
      name: 'Marie Martin',
      email: 'marie.martin@example.com',
      role: 'admin',
      avatar: '/api/placeholder/40/40',
      joinedAt: '2024-01-05',
      lastActive: '2024-01-15 14:20',
      permissions: ['read', 'write', 'deploy']
    },
    {
      id: '3',
      name: 'Pierre Durant',
      email: 'pierre.durant@example.com',
      role: 'developer',
      avatar: '/api/placeholder/40/40',
      joinedAt: '2024-01-10',
      lastActive: '2024-01-15 12:15',
      permissions: ['read', 'write']
    }
  ]

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />
      default: return <Eye className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      owner: 'default' as const,
      admin: 'secondary' as const,
      developer: 'outline' as const
    }
    return <Badge variant={variants[role as keyof typeof variants] || 'outline'}>{role}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Gestion d'Équipe
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les membres de votre équipe et leurs permissions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Inviter par email..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-64"
          />
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Inviter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-sm text-muted-foreground">Membres actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">5</div>
            <p className="text-sm text-muted-foreground">Extensions partagées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">2</div>
            <p className="text-sm text-muted-foreground">Administrateurs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membres de l'Équipe</CardTitle>
          <CardDescription>
            Gérez les rôles et permissions des membres de votre équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{member.name}</h3>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          <span>Rejoint le {member.joinedAt}</span>
                          <span>Actif: {member.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(member.role)}
                      <Select defaultValue={member.role}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {member.role === 'owner' && <SelectItem value="owner">Owner</SelectItem>}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}