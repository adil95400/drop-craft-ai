import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTenantContext } from '@/hooks/useTenantContext';
import { useMultiTenant } from '@/hooks/useMultiTenant';
import { useNavigate } from 'react-router-dom';

export function TenantSwitcher() {
  const { tenant, isLoading } = useTenantContext();
  const { tenants } = useMultiTenant();
  const navigate = useNavigate();

  const handleTenantSwitch = (tenantId: string) => {
    localStorage.setItem('current_tenant_id', tenantId);
    window.location.reload();
  };

  const handleCreateTenant = () => {
    navigate('/multi-tenant');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 animate-pulse">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (!tenant) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateTenant}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Créer un tenant
      </Button>
    );
  }

  // Access tenant properties safely with fallbacks
  const tenantName = (tenant as any).name || (tenant as any).company_name || 'Organisation';
  const planType = (tenant as any).plan_type || (tenant as any).subscription_plan || 'free';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">{tenantName}</span>
          <Badge variant="secondary" className="text-xs">
            {planType}
          </Badge>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Vos organisations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((t: any) => {
          const tName = t.name || t.company_name || 'Organisation';
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => handleTenantSwitch(t.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{tName}</span>
                </div>
                {t.id === (tenant as any).id && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateTenant} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Créer une organisation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}