import { TeamManager } from '@/components/teams/TeamManager';
import { WhiteLabelConfigurator } from '@/components/enterprise/WhiteLabelConfigurator';
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel';
import { NativeFeatures } from '@/components/capacitor/NativeFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Calendar, Bell, Paintbrush, Accessibility, Smartphone } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function CollaborationPage() {
  return (
    <ChannablePageWrapper
      title="Espace Collaboratif & Enterprise"
      description="Équipe, White-Label, Accessibilité et Fonctionnalités Natives"
      heroImage="settings"
      badge={{ label: 'Enterprise', icon: Users }}
    >
      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="team"><Users className="mr-1 h-4 w-4" />Équipe</TabsTrigger>
          <TabsTrigger value="whitelabel"><Paintbrush className="mr-1 h-4 w-4" />White-Label</TabsTrigger>
          <TabsTrigger value="a11y"><Accessibility className="mr-1 h-4 w-4" />Accessibilité</TabsTrigger>
          <TabsTrigger value="native"><Smartphone className="mr-1 h-4 w-4" />Mobile</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
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
        </TabsContent>

        <TabsContent value="whitelabel">
          <WhiteLabelConfigurator />
        </TabsContent>

        <TabsContent value="a11y">
          <AccessibilityPanel />
        </TabsContent>

        <TabsContent value="native">
          <NativeFeatures />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
