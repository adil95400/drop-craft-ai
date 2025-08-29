import React from 'react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { RequirePlan } from '@/components/plan/RequirePlan';

export default function AnalyticsPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6">
        <AnalyticsDashboard />
      </div>
    </RequirePlan>
  );
}