import { supabase } from '@/integrations/supabase/client';

export interface SecurityAuditResult {
  level: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  recommendation: string;
  affectedTables?: string[];
  sqlCommand?: string;
}

export interface SecurityAuditReport {
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  results: SecurityAuditResult[];
  lastAuditDate: string;
}

export class SecurityAuditor {
  private static instance: SecurityAuditor;
  
  static getInstance(): SecurityAuditor {
    if (!SecurityAuditor.instance) {
      SecurityAuditor.instance = new SecurityAuditor();
    }
    return SecurityAuditor.instance;
  }

  /**
   * Run comprehensive security audit
   */
  async runSecurityAudit(): Promise<SecurityAuditReport> {
    const results: SecurityAuditResult[] = [];
    
    // Check RLS policies
    results.push(...await this.auditRLSPolicies());
    
    // Check user permissions
    results.push(...await this.auditUserPermissions());
    
    // Check database functions security
    results.push(...await this.auditDatabaseFunctions());
    
    // Check API security
    results.push(...await this.auditAPISecurityEvents());
    
    // Check authentication configuration
    results.push(...await this.auditAuthConfiguration());

    const criticalIssues = results.filter(r => r.level === 'critical').length;
    const overallScore = Math.max(0, 100 - (criticalIssues * 25) - (results.length * 2));

    return {
      overallScore,
      totalIssues: results.length,
      criticalIssues,
      results,
      lastAuditDate: new Date().toISOString()
    };
  }

  private async auditRLSPolicies(): Promise<SecurityAuditResult[]> {
    const results: SecurityAuditResult[] = [];
    
    try {
      // Check tables without RLS enabled
      const { data: tablesWithoutRLS } = await supabase.rpc('get_tables_without_rls');
      
      if (tablesWithoutRLS && tablesWithoutRLS.length > 0) {
        results.push({
          level: 'critical',
          category: 'Row Level Security',
          issue: `${tablesWithoutRLS.length} table(s) without RLS enabled`,
          recommendation: 'Enable RLS on all tables containing user data',
          affectedTables: tablesWithoutRLS,
          sqlCommand: 'ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;'
        });
      }

      // Check for overly permissive policies
      const { data: permissivePolicies } = await supabase.rpc('find_permissive_policies');
      
      if (permissivePolicies && permissivePolicies.length > 0) {
        results.push({
          level: 'high',
          category: 'RLS Policies',
          issue: 'Found potentially overly permissive RLS policies',
          recommendation: 'Review and tighten policy conditions',
          affectedTables: permissivePolicies
        });
      }

    } catch (error) {
      results.push({
        level: 'medium',
        category: 'Audit System',
        issue: 'Unable to complete RLS audit',
        recommendation: 'Check database connection and permissions'
      });
    }

    return results;
  }

  private async auditUserPermissions(): Promise<SecurityAuditResult[]> {
    const results: SecurityAuditResult[] = [];
    
    try {
      // Check for users with admin privileges
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'admin');

      if (adminUsers && adminUsers.length > 5) {
        results.push({
          level: 'medium',
          category: 'User Permissions',
          issue: `High number of admin users (${adminUsers.length})`,
          recommendation: 'Review admin user list and remove unnecessary admin privileges'
        });
      }

      // Check for inactive admin accounts
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: inactiveAdmins } = await supabase
        .from('profiles')
        .select('id, full_name, last_login_at')
        .eq('role', 'admin')
        .lt('last_login_at', thirtyDaysAgo);

      if (inactiveAdmins && inactiveAdmins.length > 0) {
        results.push({
          level: 'high',
          category: 'User Permissions',
          issue: `${inactiveAdmins.length} inactive admin account(s)`,
          recommendation: 'Disable or remove admin privileges for inactive accounts'
        });
      }

    } catch (error) {
      console.error('User permissions audit error:', error);
    }

    return results;
  }

  private async auditDatabaseFunctions(): Promise<SecurityAuditResult[]> {
    const results: SecurityAuditResult[] = [];
    
    try {
      // Check for functions without proper security definer
      const { data: unsecureFunctions } = await supabase.rpc('find_unsecure_functions');
      
      if (unsecureFunctions && unsecureFunctions.length > 0) {
        results.push({
          level: 'high',
          category: 'Database Functions',
          issue: `${unsecureFunctions.length} function(s) without proper security context`,
          recommendation: 'Add SECURITY DEFINER and SET search_path to functions'
        });
      }

    } catch (error) {
      console.error('Database functions audit error:', error);
    }

    return results;
  }

  private async auditAPISecurityEvents(): Promise<SecurityAuditResult[]> {
    const results: SecurityAuditResult[] = [];
    
    try {
      // Check for recent security incidents
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentIncidents } = await supabase
        .from('security_events')
        .select('event_type, severity')
        .eq('severity', 'critical')
        .gte('created_at', twentyFourHoursAgo);

      if (recentIncidents && recentIncidents.length > 0) {
        results.push({
          level: 'critical',
          category: 'Security Events',
          issue: `${recentIncidents.length} critical security event(s) in last 24h`,
          recommendation: 'Investigate and address critical security events immediately'
        });
      }

      // Check for failed login attempts
      const { data: failedLogins } = await supabase
        .from('security_events')
        .select('metadata')
        .eq('event_type', 'failed_login')
        .gte('created_at', twentyFourHoursAgo);

      if (failedLogins && failedLogins.length > 100) {
        results.push({
          level: 'high',
          category: 'Authentication',
          issue: `High number of failed login attempts (${failedLogins.length})`,
          recommendation: 'Implement rate limiting and monitor for brute force attacks'
        });
      }

    } catch (error) {
      console.error('API security events audit error:', error);
    }

    return results;
  }

  private async auditAuthConfiguration(): Promise<SecurityAuditResult[]> {
    const results: SecurityAuditResult[] = [];
    
    // These would typically be checked via Supabase API or configuration
    // For now, we'll provide general recommendations
    
    results.push({
      level: 'medium',
      category: 'Authentication',
      issue: 'Manual verification needed for auth configuration',
      recommendation: 'Verify: JWT expiry (< 1h), password requirements (8+ chars), MFA enabled for admins'
    });

    return results;
  }

  /**
   * Fix security issues automatically where possible
   */
  async fixSecurityIssue(issueId: string, sqlCommand?: string): Promise<boolean> {
    if (!sqlCommand) return false;
    
    try {
      // Execute the fix SQL command
      const { error } = await supabase.rpc('execute_security_fix', {
        sql_command: sqlCommand
      });
      
      if (error) {
        console.error('Security fix failed:', error);
        return false;
      }

      // Log the security fix
      await supabase.from('security_events').insert({
        event_type: 'security_fix_applied',
        severity: 'info',
        description: `Automated security fix applied: ${issueId}`,
        metadata: { sql_command: sqlCommand }
      });

      return true;
    } catch (error) {
      console.error('Security fix error:', error);
      return false;
    }
  }
}

export const securityAuditor = SecurityAuditor.getInstance();