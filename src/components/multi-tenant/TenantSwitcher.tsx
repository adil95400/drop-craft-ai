import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TenantSwitcher() {
  const [currentTenant] = useState('Organisation principale');

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
      <Building2 className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{currentTenant}</span>
      <Badge variant="secondary" className="text-xs">Multi-tenant</Badge>
    </div>
  );
}
