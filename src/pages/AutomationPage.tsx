import React from 'react';
import { AutomationDashboard } from '@/components/automation/AutomationDashboard';
import { SampleDataSeeder } from '@/components/automation/SampleDataSeeder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function AutomationPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          Automatisation IA
        </h1>
        <p className="text-muted-foreground">
          Gérez vos déclencheurs et actions automatiques
        </p>
      </div>

      {/* Sample Data Seeder */}
      <SampleDataSeeder />

      {/* Main Dashboard */}
      <AutomationDashboard />
    </div>
  );
}