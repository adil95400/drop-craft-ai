/**
 * Feed Rules Page
 * Page de gestion des règles if/then pour les flux
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Play, 
  Pause,
  Settings,
  FileText,
} from 'lucide-react';
import { 
  useFeedRules, 
  useFeedRulesStats,
} from '@/hooks/useFeedRules';
import { CreateRuleDialog } from '@/components/feed-rules/CreateRuleDialog';
import { FeedRulesDashboard } from '@/components/feed-rules';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';

export default function FeedRulesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: stats } = useFeedRulesStats();
  
  const activeRules = stats?.activeRules || 0;
  const inactiveRules = (stats?.totalRules || 0) - activeRules;
  const totalRules = stats?.totalRules || 0;

  return (
    <div className="container mx-auto py-6 px-4">
      <FeedSubNavigation />
      
      {/* Header amélioré */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Règles d'automatisation</h1>
          <p className="text-muted-foreground">
            Configurez les règles de fulfillment automatique
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle règle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Règles actives</p>
                <p className="text-3xl font-bold text-foreground">{activeRules}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <Play className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Règles inactives</p>
                <p className="text-3xl font-bold text-foreground">{inactiveRules}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <Pause className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total règles</p>
                <p className="text-3xl font-bold text-foreground">{totalRules}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State ou Liste */}
      {totalRules === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucune règle d'automatisation configurée
            </p>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer votre première règle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <FeedRulesDashboard />
      )}

      {/* Dialog de création */}
      <CreateRuleDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        editRule={null}
        onClose={() => {}}
      />
    </div>
  );
}
