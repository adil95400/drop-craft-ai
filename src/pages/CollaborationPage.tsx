import { TeamManager } from '@/components/teams/TeamManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Calendar, Bell } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function CollaborationPage() {
  return (
    <ChannablePageWrapper
      title="Espace Collaboratif"
      description="Travaillez en équipe de manière efficace"
      heroImage="settings"
      badge={{ label: 'Équipe', icon: Users }}
    >
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Membres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-sm text-muted-foreground">Dans toutes les équipes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">47</div>
            <p className="text-sm text-muted-foreground">Non lus cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-sm text-muted-foreground">À venir ce mois-ci</p>
          </CardContent>
        </Card>
      </div>

      <TeamManager />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications d'Équipe
          </CardTitle>
          <CardDescription>Dernières activités</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { user: 'Marie', action: 'a ajouté 3 nouveaux produits', time: 'Il y a 2h' },
              { user: 'Pierre', action: 'a généré un rapport de ventes', time: 'Il y a 4h' },
              { user: 'Sophie', action: 'a invité 2 nouveaux membres', time: 'Hier' }
            ].map((notif, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{notif.user} {notif.action}</p>
                  <p className="text-sm text-muted-foreground">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
