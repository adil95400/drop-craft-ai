import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageSquare, Calendar, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function TeamCollaboration() {
  const teamMembers = [
    { name: "Alice Martin", role: "Chef de Projet", avatar: "/avatars/alice.jpg", status: "online", tasks: 12 },
    { name: "Bob Durant", role: "Développeur", avatar: "/avatars/bob.jpg", status: "busy", tasks: 8 },
    { name: "Clara Petit", role: "Designer", avatar: "/avatars/clara.jpg", status: "away", tasks: 6 },
    { name: "David Moreau", role: "Analyste", avatar: "/avatars/david.jpg", status: "online", tasks: 10 },
  ];

  const recentActivity = [
    { user: "Alice Martin", action: "a créé un nouveau projet", time: "Il y a 2h", type: "create" },
    { user: "Bob Durant", action: "a terminé la tâche #1247", time: "Il y a 3h", type: "complete" },
    { user: "Clara Petit", action: "a partagé un design", time: "Il y a 4h", type: "share" },
    { user: "David Moreau", action: "a mis à jour les analytics", time: "Il y a 5h", type: "update" },
  ];

  const projects = [
    { name: "Refonte E-commerce", progress: 75, members: 4, deadline: "2024-02-15" },
    { name: "Migration API", progress: 45, members: 3, deadline: "2024-02-28" },
    { name: "Dashboard Analytics", progress: 90, members: 2, deadline: "2024-02-10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <PageHeader
        title="Collaboration d'Équipe"
        description="Coordonnez vos projets et communiquez efficacement avec votre équipe"
        badge="Team Hub"
      />

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres d'Équipe</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +2 nouveaux ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                3 en cours de finalisation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tâches Complétées</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">147</div>
              <p className="text-xs text-muted-foreground">
                +23% cette semaine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                Échangés aujourd'hui
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Projets en Cours</CardTitle>
              <CardDescription>
                Suivi des projets et de leur avancement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge variant="outline">{project.progress}%</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{project.members} membres</span>
                        <span>Échéance: {project.deadline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Équipe Active</CardTitle>
              <CardDescription>
                Membres connectés et leur statut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        member.status === 'online' ? 'bg-green-500' :
                        member.status === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {member.tasks} tâches
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Dernières actions de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'create' ? 'bg-blue-500' :
                    activity.type === 'complete' ? 'bg-green-500' :
                    activity.type === 'share' ? 'bg-purple-500' : 'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{' '}
                      {activity.action}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}