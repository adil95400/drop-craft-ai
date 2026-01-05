/**
 * Feed Rules Page
 * Page de gestion des règles if/then pour les flux
 */
import { FeedRulesDashboard } from '@/components/feed-rules';

export default function FeedRulesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <FeedRulesDashboard />
    </div>
  );
}
