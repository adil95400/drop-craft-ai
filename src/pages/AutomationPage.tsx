import React from 'react';
import { AutomationManager } from '@/components/automation/AutomationManager';
import { RequirePlan } from '@/components/plan/RequirePlan';

export default function AutomationPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6">
        <AutomationManager />
      </div>
    </RequirePlan>
  );
}