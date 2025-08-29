import React from 'react';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { RequirePlan } from '@/components/plan/RequirePlan';

export default function MonitoringPage() {
  return (
    <RequirePlan minPlan="pro">
      <div className="container mx-auto py-6">
        <MonitoringDashboard />
      </div>
    </RequirePlan>
  );
}