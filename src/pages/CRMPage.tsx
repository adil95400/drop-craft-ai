import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Mail, Phone, Calendar, TrendingUp, Target, Filter } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function CRMPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { title: 'Contacts Total', value: '1,247', icon: Users, change: '+12%' },
    { title: 'Prospects Actifs', value: '89', icon: Target, change: '+5%' },
    { title: 'Conversions ce mois', value: '23', icon: TrendingUp, change: '+18%' },
    { title: 'Taux de conversion', value: '25.8%', icon: Calendar, change: '+3.2%' }
  ];

  return (
    <>
      <Helmet>
        <title>CRM - Gestion de la Relation Client | Drop Craft AI</title>
        <meta name="description" content="Gérez efficacement votre relation client avec notre CRM intégré. Suivi des prospects, pipeline de ventes et analytics." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CRM Pro</h1>
            <p className="text-muted-foreground">
              Gérez vos prospects et optimisez votre pipeline de ventes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouveau Contact
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> depuis le mois dernier
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestion des Contacts</CardTitle>
                    <CardDescription>
                      Gérez votre base de contacts et prospects
                    </CardDescription>
                  </div>
                  <Input
                    placeholder="Rechercher un contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Liste des contacts simulée */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Contact {i}</h4>
                          <p className="text-sm text-muted-foreground">contact{i}@example.com</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={i % 3 === 0 ? "default" : i % 2 === 0 ? "secondary" : "outline"}>
                          {i % 3 === 0 ? "Client" : i % 2 === 0 ? "Prospect" : "Lead"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline de Ventes</CardTitle>
                <CardDescription>
                  Suivez l'évolution de vos opportunités commerciales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Pipeline en cours de développement</h3>
                  <p className="text-muted-foreground">
                    La visualisation du pipeline sera bientôt disponible
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics CRM</CardTitle>
                <CardDescription>
                  Analysez les performances de votre relation client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics en cours de développement</h3>
                  <p className="text-muted-foreground">
                    Les rapports détaillés seront bientôt disponibles
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}