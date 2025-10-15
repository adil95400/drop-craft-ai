import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Mail, Phone, TrendingUp, Target } from "lucide-react";

export default function CrmPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground mt-1">Gestion de la relation client</p>
        </div>
        <Badge variant="secondary">Pro</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contacts totaux</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nouveaux ce mois</p>
              <p className="text-2xl font-bold">89</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leads qualifiés</p>
              <p className="text-2xl font-bold">234</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux conversion</p>
              <p className="text-2xl font-bold">23.4%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Fonctionnalités CRM</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Gestion des contacts</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Centralisez toutes vos informations clients
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Suivi des leads</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Pipeline de vente et scoring automatique
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Campagnes email</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Automatisez vos communications clients
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            Importez vos contacts existants ou créez-en de nouveaux pour commencer
          </p>
          <div className="flex gap-3">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un contact
            </Button>
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Importer des contacts
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
