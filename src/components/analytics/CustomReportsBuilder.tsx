import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, BarChart, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReportConfig {
  name: string;
  description: string;
  type: 'sales' | 'products' | 'customers' | 'marketing' | 'custom';
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  config: any;
}

export function CustomReportsBuilder() {
  const [report, setReport] = useState<ReportConfig>({
    name: '',
    description: '',
    type: 'sales',
    schedule: 'manual',
    config: {}
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    { value: 'sales', label: 'Ventes', icon: TrendingUp },
    { value: 'products', label: 'Produits', icon: ShoppingCart },
    { value: 'customers', label: 'Clients', icon: Users },
    { value: 'marketing', label: 'Marketing', icon: BarChart },
    { value: 'custom', label: 'Personnalisé', icon: Plus }
  ];

  const handleSave = async () => {
    if (!report.name) {
      toast({
        title: "❌ Erreur",
        description: "Le nom du rapport est requis",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await (supabase as any)
        .from('custom_reports')
        .insert({
          name: report.name,
          description: report.description,
          report_type: report.type,
          schedule: report.schedule,
          config: report.config,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✅ Rapport créé",
        description: `Le rapport "${report.name}" a été créé avec succès`
      });

      setReport({
        name: '',
        description: '',
        type: 'sales',
        schedule: 'manual',
        config: {}
      });
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Créer un Rapport Personnalisé
        </CardTitle>
        <CardDescription>
          Configurez un rapport adapté à vos besoins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du rapport</Label>
            <Input
              id="name"
              placeholder="Mon rapport mensuel"
              value={report.name}
              onChange={(e) => setReport({ ...report, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez l'objectif de ce rapport..."
              value={report.description}
              onChange={(e) => setReport({ ...report, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de rapport</Label>
              <Select
                value={report.type}
                onValueChange={(value: any) => setReport({ ...report, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Planification</Label>
              <Select
                value={report.schedule}
                onValueChange={(value: any) => setReport({ ...report, schedule: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setReport({
              name: '',
              description: '',
              type: 'sales',
              schedule: 'manual',
              config: {}
            })}
          >
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
