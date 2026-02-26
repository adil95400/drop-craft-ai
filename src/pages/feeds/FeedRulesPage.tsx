/**
 * Feed Rules Page
 * Page de gestion des règles if/then pour les flux - Style Channable
 */
import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Button } from '@/components/ui/button';
import { Plus, GitBranch } from 'lucide-react';
import { useFeedRulesStats } from '@/hooks/useFeedRules';
import { CreateRuleDialog } from '@/components/feed-rules/CreateRuleDialog';
import { FeedRulesDashboard } from '@/components/feed-rules';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

export default function FeedRulesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: stats } = useFeedRulesStats();
  
  const activeRules = stats?.activeRules || 0;
  const totalRules = stats?.totalRules || 0;

  return (
    <ChannablePageWrapper
      title="Règles d'Automatisation"
      subtitle="Fulfillment"
      description={`${activeRules} règles actives sur ${totalRules} • Transformez vos flux avec des règles IF/THEN intelligentes`}
      heroImage="automation"
      badge={{ label: "Règles", icon: GitBranch }}
      actions={
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle règle
        </Button>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.feedRules} />
      <FeedRulesDashboard />

      <CreateRuleDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        editRule={null}
        onClose={() => setIsCreateOpen(false)}
      />
    </ChannablePageWrapper>
  );
}
