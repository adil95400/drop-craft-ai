import React from 'react';
import { AdvancedTools } from '@/components/tools/AdvancedTools';
import { RequirePlan } from '@/components/plan/RequirePlan';

export default function AdvancedToolsPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6">
        <AdvancedTools />
      </div>
    </RequirePlan>
  );
}