import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Mail, Phone, TrendingUp, Target } from "lucide-react";

export default function CrmPage() {
  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">CRM</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestion de la relation client</p>
        </div>
        <Badge variant="secondary">Pro</Badge>
      </div>

      <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Contacts</p>
              <p className="text-lg sm:text-2xl font-bold">1,247</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Nouveaux</p>
              <p className="text-lg sm:text-2xl font-bold">89</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Leads</p>
              <p className="text-lg sm:text-2xl font-bold">234</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Conversion</p>
              <p className="text-lg sm:text-2xl font-bold">23.4%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Fonctionnalités CRM</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Gestion des contacts</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Centralisez toutes vos informations clients
            </p>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Suivi des leads</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pipeline de vente et scoring automatique
            </p>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Campagnes email</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Automatisez vos communications clients
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
            Importez vos contacts existants ou créez-en de nouveaux
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button size="sm" className="sm:size-default">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Ajouter contact
            </Button>
            <Button variant="outline" size="sm" className="sm:size-default">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Importer
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
