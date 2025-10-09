import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages, DollarSign, Globe, Settings, Zap } from "lucide-react";
import { ProductTranslationsTab } from "./tabs/ProductTranslationsTab";
import { CurrenciesTab } from "./tabs/CurrenciesTab";
import { GeoTargetingTab } from "./tabs/GeoTargetingTab";
import { LocaleSettingsTab } from "./tabs/LocaleSettingsTab";
import { TranslationJobsTab } from "./tabs/TranslationJobsTab";

export const InternationalizationHub = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Internationalisation</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les traductions, devises et ciblage géographique de votre boutique
          </p>
        </div>
      </div>

      <Tabs defaultValue="translations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="translations" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Traductions
          </TabsTrigger>
          <TabsTrigger value="currencies" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Devises
          </TabsTrigger>
          <TabsTrigger value="geo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Ciblage Géo
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="translations">
          <ProductTranslationsTab />
        </TabsContent>

        <TabsContent value="currencies">
          <CurrenciesTab />
        </TabsContent>

        <TabsContent value="geo">
          <GeoTargetingTab />
        </TabsContent>

        <TabsContent value="settings">
          <LocaleSettingsTab />
        </TabsContent>

        <TabsContent value="jobs">
          <TranslationJobsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};