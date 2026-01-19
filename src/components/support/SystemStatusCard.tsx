import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Wrench,
  Activity,
  Server,
  RefreshCw,
  Upload,
  Download,
  Shield,
  HardDrive
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSystemStatus, SystemService } from '@/hooks/useSystemStatus';

const serviceIcons: Record<string, React.ComponentType<any>> = {
  api: Server,
  sync: RefreshCw,
  import: Upload,
  export: Download,
  auth: Shield,
  storage: HardDrive,
};

const statusConfig = {
  operational: {
    label: 'Opérationnel',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-500/10',
    icon: CheckCircle,
  },
  degraded: {
    label: 'Dégradé',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    icon: AlertTriangle,
  },
  partial_outage: {
    label: 'Panne partielle',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    icon: AlertTriangle,
  },
  major_outage: {
    label: 'Panne majeure',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-500/10',
    icon: XCircle,
  },
  maintenance: {
    label: 'Maintenance',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    icon: Wrench,
  },
};

interface ServiceRowProps {
  service: SystemService;
  index: number;
}

function ServiceRow({ service, index }: ServiceRowProps) {
  const config = statusConfig[service.status];
  const StatusIcon = config.icon;
  const ServiceIcon = serviceIcons[service.service_name] || Server;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-md ${config.bgColor}`}>
          <ServiceIcon className={`h-3.5 w-3.5 ${config.textColor}`} />
        </div>
        <div>
          <span className="text-sm font-medium capitalize">
            {service.service_name}
          </span>
          {service.description && (
            <p className="text-xs text-muted-foreground">{service.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    </motion.div>
  );
}

export function SystemStatusCard() {
  const { services, isLoading, overallStatus, operationalCount, totalServices } = useSystemStatus();

  const overallConfig = statusConfig[overallStatus as keyof typeof statusConfig] || statusConfig.operational;
  const OverallIcon = overallConfig.icon;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            État du système
          </CardTitle>
          <Badge variant="outline" className={`${overallConfig.bgColor} ${overallConfig.textColor} border-0`}>
            <OverallIcon className="h-3 w-3 mr-1" />
            {overallStatus === 'operational' 
              ? 'Tous les systèmes opérationnels' 
              : overallConfig.label
            }
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {operationalCount}/{totalServices} services actifs
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-border/50">
          {services.map((service, index) => (
            <ServiceRow key={service.id} service={service} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
