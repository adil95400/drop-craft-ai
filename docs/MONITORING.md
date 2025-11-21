# 📊 Guide de Monitoring - Drop Craft AI

## Vue d'ensemble

Ce document décrit la stratégie complète de surveillance, monitoring et alertes pour garantir la disponibilité et les performances de la plateforme.

---

## 🎯 Objectifs de Monitoring

### SLOs (Service Level Objectives)

| Métrique | Objectif | Critique |
|----------|----------|----------|
| **Uptime** | 99.9% | ✅ Oui |
| **Response Time (P95)** | < 500ms | ✅ Oui |
| **Error Rate** | < 0.1% | ✅ Oui |
| **Database Query Time** | < 100ms | ⚠️ Important |
| **API Success Rate** | > 99.5% | ✅ Oui |

---

## 🔧 Stack de Monitoring

### Infrastructure

- **Supabase Dashboard** - Métriques base de données
- **Vercel Analytics** - Performance frontend
- **Sentry** - Error tracking & monitoring
- **Uptime Robot** - Monitoring disponibilité
- **CloudWatch** (si AWS) - Logs & métriques

### Application

- **React Query DevTools** - Cache & requêtes
- **Console Logs** - Debug développement
- **Custom Analytics** - Événements business

---

## 📈 Métriques Clés

### 1. Performance Frontend

#### Core Web Vitals

```typescript
// src/utils/performance-monitoring.ts
import { onLCP, onFID, onCLS } from 'web-vitals';

export function initPerformanceMonitoring() {
  onLCP(metric => {
    console.log('LCP:', metric.value);
    // Seuil: < 2.5s (bon), < 4s (moyen)
    if (metric.value > 4000) {
      sendAlert('LCP_SLOW', metric);
    }
  });

  onFID(metric => {
    console.log('FID:', metric.value);
    // Seuil: < 100ms (bon), < 300ms (moyen)
    if (metric.value > 300) {
      sendAlert('FID_SLOW', metric);
    }
  });

  onCLS(metric => {
    console.log('CLS:', metric.value);
    // Seuil: < 0.1 (bon), < 0.25 (moyen)
    if (metric.value > 0.25) {
      sendAlert('CLS_HIGH', metric);
    }
  });
}
```

#### Temps de Chargement

```typescript
// Monitoring du chargement initial
window.addEventListener('load', () => {
  const perfData = performance.timing;
  const loadTime = perfData.loadEventEnd - perfData.navigationStart;
  
  trackMetric('page_load_time', loadTime);
  
  if (loadTime > 3000) {
    sendAlert('SLOW_PAGE_LOAD', { loadTime });
  }
});
```

### 2. Base de Données

#### Métriques Supabase

**Dashboard Supabase → Database → Reports**

Surveiller:
- **Active Connections**: < 80% du max
- **Query Duration**: P95 < 100ms
- **Table Size Growth**: Croissance prévue
- **Cache Hit Ratio**: > 95%
- **Deadlocks**: 0 par jour

#### Slow Queries

```sql
-- Identifier les requêtes lentes
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- > 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

#### Index Coverage

```sql
-- Vérifier couverture des index
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%pkey';
```

### 3. Edge Functions

#### Monitoring via Supabase

```typescript
// supabase/functions/monitoring/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const startTime = Date.now();
  
  try {
    // Votre logique
    const result = await processRequest(req);
    
    const duration = Date.now() - startTime;
    
    // Log des métriques
    console.log(JSON.stringify({
      type: 'metric',
      function: 'monitoring',
      duration,
      status: 'success'
    }));
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log d'erreur
    console.error(JSON.stringify({
      type: 'error',
      function: 'monitoring',
      duration,
      error: error.message
    }));
    
    // Alerte si erreur critique
    await sendAlert('EDGE_FUNCTION_ERROR', {
      function: 'monitoring',
      error: error.message
    });
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
});
```

#### Dashboard de Logs

```bash
# Voir les logs en temps réel
npx supabase functions logs --project-ref YOUR_PROJECT_REF

# Filtrer par fonction
npx supabase functions logs monitoring --project-ref YOUR_PROJECT_REF
```

### 4. APIs Tierces

#### Monitoring Intégrations

```typescript
// src/services/monitoring/api-health.ts
export async function checkAPIHealth() {
  const integrations = [
    { name: 'Shopify', endpoint: 'https://myshop.myshopify.com/admin/api/2024-01/shop.json' },
    { name: 'Stripe', endpoint: 'https://api.stripe.com/v1/balance' },
    { name: 'BigBuy', endpoint: 'https://api.bigbuy.eu/rest/catalog/products' }
  ];
  
  const results = await Promise.all(
    integrations.map(async (integration) => {
      const start = Date.now();
      
      try {
        const response = await fetch(integration.endpoint, {
          headers: { /* auth */ }
        });
        
        const duration = Date.now() - start;
        const status = response.ok ? 'healthy' : 'degraded';
        
        return {
          name: integration.name,
          status,
          responseTime: duration,
          statusCode: response.status
        };
        
      } catch (error) {
        return {
          name: integration.name,
          status: 'down',
          error: error.message
        };
      }
    })
  );
  
  // Alerter si API down
  results.forEach(result => {
    if (result.status === 'down') {
      sendAlert('API_DOWN', result);
    }
  });
  
  return results;
}

// Exécuter toutes les 5 minutes
setInterval(checkAPIHealth, 5 * 60 * 1000);
```

---

## 🚨 Système d'Alertes

### Configuration des Alertes

```typescript
// src/services/monitoring/alerts.ts
export interface AlertRule {
  id: string;
  name: string;
  condition: () => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'sms' | 'slack' | 'webhook')[];
  throttle: number; // Minutes entre alertes
}

const alertRules: AlertRule[] = [
  {
    id: 'high_error_rate',
    name: 'Taux d\'erreur élevé',
    condition: () => errorRate > 1,
    severity: 'critical',
    channels: ['email', 'sms', 'slack'],
    throttle: 5
  },
  {
    id: 'slow_response',
    name: 'Temps de réponse lent',
    condition: () => avgResponseTime > 1000,
    severity: 'high',
    channels: ['email', 'slack'],
    throttle: 15
  },
  {
    id: 'database_connections',
    name: 'Connexions DB élevées',
    condition: () => dbConnections > 80,
    severity: 'medium',
    channels: ['slack'],
    throttle: 30
  }
];
```

### Canaux d'Alertes

#### Email

```typescript
// Via Edge Function
async function sendEmailAlert(alert: Alert) {
  await fetch('https://your-project.supabase.co/functions/v1/send-alert-email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: 'ops@drop-craft-ai.com',
      subject: `[${alert.severity.toUpperCase()}] ${alert.name}`,
      body: alert.description
    })
  });
}
```

#### Slack

```typescript
async function sendSlackAlert(alert: Alert) {
  await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 *${alert.name}*`,
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Time', value: new Date().toISOString(), short: true },
          { title: 'Description', value: alert.description }
        ]
      }]
    })
  });
}
```

#### SMS (Twilio)

```typescript
async function sendSMSAlert(alert: Alert) {
  // Uniquement pour alertes critiques
  if (alert.severity !== 'critical') return;
  
  await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: '+33612345678',
      From: '+33987654321',
      Body: `CRITICAL: ${alert.name} - ${alert.description}`
    })
  });
}
```

---

## 📊 Dashboards

### Dashboard Principal

```typescript
// src/pages/admin/monitoring-dashboard.tsx
export function MonitoringDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* System Health */}
      <Card>
        <CardHeader>System Health</CardHeader>
        <CardContent>
          <StatusIndicator status={systemHealth} />
          <Metric label="Uptime" value="99.95%" />
          <Metric label="Response Time" value="245ms" />
        </CardContent>
      </Card>
      
      {/* Active Users */}
      <Card>
        <CardHeader>Active Users</CardHeader>
        <CardContent>
          <LineChart data={activeUsersData} />
          <Metric label="Current" value="1,247" />
        </CardContent>
      </Card>
      
      {/* Error Rate */}
      <Card>
        <CardHeader>Error Rate</CardHeader>
        <CardContent>
          <AreaChart data={errorRateData} />
          <Metric label="Last Hour" value="0.02%" />
        </CardContent>
      </Card>
      
      {/* Database Metrics */}
      <Card className="col-span-2">
        <CardHeader>Database Performance</CardHeader>
        <CardContent>
          <Metric label="Connections" value="45/100" />
          <Metric label="Query Time P95" value="87ms" />
          <Metric label="Cache Hit Rate" value="96.2%" />
        </CardContent>
      </Card>
      
      {/* Recent Alerts */}
      <Card>
        <CardHeader>Recent Alerts</CardHeader>
        <CardContent>
          <AlertsList alerts={recentAlerts} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Grafana (Optionnel)

Pour monitoring avancé, intégrer Grafana:

```yaml
# docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana/dashboards:/var/lib/grafana/dashboards
```

---

## 🔍 Logs & Debugging

### Structure des Logs

```typescript
// Format JSON pour faciliter parsing
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

// Logger centralisé
export class Logger {
  static log(level: LogEntry['level'], message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'drop-craft-ai',
      message,
      context,
      requestId: getCurrentRequestId()
    };
    
    console.log(JSON.stringify(entry));
    
    // Envoyer à service de logs (optionnel)
    if (level === 'error') {
      sendToLogService(entry);
    }
  }
  
  static error(message: string, error: Error, context?: any) {
    this.log('error', message, {
      ...context,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}
```

### Agrégation des Logs

```bash
# Logs Supabase (30 derniers jours)
npx supabase functions logs --project-ref YOUR_REF

# Filtrer par niveau
npx supabase functions logs --project-ref YOUR_REF | grep '"level":"error"'

# Export vers fichier
npx supabase functions logs --project-ref YOUR_REF > logs.json
```

---

## 📞 Oncall & Incident Response

### Rotation Oncall

| Semaine | Ingénieur Principal | Backup |
|---------|-------------------|--------|
| Semaine 1 | Alice | Bob |
| Semaine 2 | Bob | Charlie |
| Semaine 3 | Charlie | Alice |

### Procédure d'Incident

#### Niveau 1: Critique (Production Down)

1. **Alerte reçue** → Slack + SMS
2. **Acknowledge** sous 5 minutes
3. **Investigation** immédiate
4. **Communication** status page
5. **Escalade** si non résolu en 15 min
6. **Post-mortem** obligatoire

#### Niveau 2: Majeur (Dégradation)

1. **Alerte reçue** → Slack + Email
2. **Acknowledge** sous 15 minutes
3. **Investigation** sous 30 minutes
4. **Communication** si > 1h
5. **Post-mortem** si récurrent

#### Niveau 3: Mineur

1. **Alerte reçue** → Slack
2. **Ticket créé** automatiquement
3. **Investigation** sous 24h
4. **Fix** dans prochain sprint

### Runbooks

```markdown
# Runbook: Database High Connections

## Symptômes
- Alert: "database_connections_high"
- Dashboard showing > 80 connections

## Investigation
1. Check active queries:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

2. Identify long-running queries:
   ```sql
   SELECT * FROM pg_stat_activity 
   WHERE state = 'active' 
   AND query_start < NOW() - INTERVAL '5 minutes';
   ```

## Resolution
1. Kill long-running queries if safe
2. Restart application if connection leak
3. Scale up database if needed

## Prevention
- Implement connection pooling
- Add query timeouts
- Monitor for leaks
```

---

## 🎯 KPIs & Reporting

### Dashboard Exécutif (Hebdomadaire)

```typescript
export interface WeeklyReport {
  uptime: number;           // 99.95%
  avgResponseTime: number;  // 245ms
  totalErrors: number;      // 12
  deployments: number;      // 5
  incidents: {
    critical: number;       // 0
    major: number;          // 1
    minor: number;          // 3
  };
  userSatisfaction: number; // 4.8/5
}
```

### Rapport Automatisé

```typescript
// Edge Function: weekly-report
async function generateWeeklyReport() {
  const report = await calculateMetrics();
  
  await sendEmail({
    to: 'leadership@drop-craft-ai.com',
    subject: `Weekly Platform Report - ${getWeekNumber()}`,
    html: renderReport(report)
  });
}

// Cron: Tous les lundis à 9h
```

---

## 🛠️ Outils Recommandés

### Monitoring SaaS

- **Sentry** - Error tracking ($26/mois)
- **Datadog** - Infrastructure ($15/host/mois)
- **New Relic** - APM ($99/mois)
- **Uptime Robot** - Uptime monitoring (Gratuit/Pro)

### Open Source

- **Grafana** - Dashboards
- **Prometheus** - Métriques
- **Loki** - Logs
- **Jaeger** - Distributed tracing

---

## 📚 Ressources

- [Supabase Monitoring Docs](https://supabase.com/docs/guides/platform/metrics)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [Monitoring Best Practices](https://www.datadoghq.com/blog/monitoring-101-collecting-data/)

---

**Dernière mise à jour**: 2024-01-XX  
**Contact Ops**: ops@drop-craft-ai.com  
**Oncall Phone**: +33 1 XX XX XX XX
