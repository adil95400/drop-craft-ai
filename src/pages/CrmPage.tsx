import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Mail, Phone, TrendingUp, Target, Tags, MessageSquare, BarChart3, Zap } from "lucide-react";
import { CustomerInteractions } from "@/components/crm/CustomerInteractions";
import { CustomerTags } from "@/components/crm/CustomerTags";
import { LeadScoring } from "@/components/crm/LeadScoring";
import { LeadNurturing } from "@/components/crm/LeadNurturing";
import { CRMReports } from "@/components/crm/CRMReports";

export default function CrmPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">CRM Avancé</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestion complète de la relation client</p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="interactions" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Interactions</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Tags</span>
          </TabsTrigger>
          <TabsTrigger value="scoring" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Scoring</span>
          </TabsTrigger>
          <TabsTrigger value="nurturing" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Nurturing</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Rapports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Fonctionnalités CRM</h2>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("interactions")}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-medium">Interactions</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Notes, tâches et historique complet
                </p>
              </div>

              <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("tags")}>
                <div className="flex items-center gap-2 mb-2">
                  <Tags className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-medium">Tags personnalisés</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Catégorisez vos clients efficacement
                </p>
              </div>

              <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("scoring")}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-medium">Lead Scoring</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Scoring automatique et priorisation
                </p>
              </div>

              <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("nurturing")}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-medium">Lead Nurturing</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Campagnes automatisées et workflows
                </p>
              </div>

              <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("reports")}>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-medium">Rapports détaillés</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Analyses et KPIs avancés
                </p>
              </div>

              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-medium">Campagnes email</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Automatisez vos communications
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
        </TabsContent>

        <TabsContent value="interactions">
          <CustomerInteractions />
        </TabsContent>

        <TabsContent value="tags">
          <CustomerTags />
        </TabsContent>

        <TabsContent value="scoring">
          <LeadScoring />
        </TabsContent>

        <TabsContent value="nurturing">
          <LeadNurturing />
        </TabsContent>

        <TabsContent value="reports">
          <CRMReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
