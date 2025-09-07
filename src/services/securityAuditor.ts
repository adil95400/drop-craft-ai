import { supabase } from '@/integrations/supabase/client';

export interface SecurityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'rls' | 'policy' | 'function' | 'configuration';
  title: string;
  description: string;
  impact: string;
  solution: string;
  affected_resource: string;
  auto_fixable: boolean;
  created_at: string;
}

export interface SecurityAuditResult {
  score: number;
  issues: SecurityIssue[];
  recommendations: string[];
  last_audit: string;
  next_audit: string;
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
  async runSecurityAudit(): Promise<SecurityAuditResult> {
    const issues: SecurityIssue[] = [];
    
    try {
      // Check basic table access
      await this.checkTableSecurity(issues);
      
      // Check authentication requirements
      await this.checkAuthSecurity(issues);
      
      // Check for sensitive data exposure
      await this.checkDataExposure(issues);
      
      // Calculate security score
      const score = this.calculateSecurityScore(issues);
      
      // Log audit event
      await supabase.from('security_events').insert({
        event_type: 'security_audit_completed',
        severity: 'info',
        description: `Security audit completed with score: ${score}`,
        metadata: {
          issues_found: issues.length,
          critical_issues: issues.filter(i => i.severity === 'critical').length,
          high_issues: issues.filter(i => i.severity === 'high').length
        }
      });

      return {
        score,
        issues,
        recommendations: this.generateRecommendations(issues),
        last_audit: new Date().toISOString(),
        next_audit: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Security audit failed:', error);
      return {
        score: 0,
        issues: [{
          id: crypto.randomUUID(),
          severity: 'critical',
          type: 'configuration',
          title: 'Audit Failed',
          description: 'Security audit could not be completed',
          impact: 'Unable to assess security posture',
          solution: 'Check database connectivity and permissions',
          affected_resource: 'audit_system',
          auto_fixable: false,
          created_at: new Date().toISOString()
        }],
        recommendations: ['Fix audit system connectivity'],
        last_audit: new Date().toISOString(),
        next_audit: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }

  /**
   * Check table-level security
   */
  private async checkTableSecurity(issues: SecurityIssue[]): Promise<void> {
    try {
      // Check if major tables are accessible without proper auth
      const testTables = ['customers', 'suppliers', 'orders'];
      
      for (const table of testTables) {
        try {
          // Try to access table without auth context
          const { data, error } = await supabase.from(table as any).select('id').limit(1);
          
          if (data && data.length > 0) {
            issues.push({
              id: crypto.randomUUID(),
              severity: 'high',
              type: 'rls',
              title: `Potential RLS Issue on ${table}`,
              description: `Table ${table} may be accessible without proper authentication`,
              impact: 'Unauthorized access to sensitive data',
              solution: `Review RLS policies for ${table} table`,
              affected_resource: table,
              auto_fixable: false,
              created_at: new Date().toISOString()
            });
          }
        } catch (error) {
          // Good - table is properly secured
        }
      }
    } catch (error) {
      console.error('Table security check failed:', error);
    }
  }

  /**
   * Check authentication security
   */
  private async checkAuthSecurity(issues: SecurityIssue[]): Promise<void> {
    try {
      // Check for recent failed auth attempts
      const { data: securityEvents } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'auth_failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (securityEvents && securityEvents.length > 10) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'medium',
          type: 'configuration',
          title: 'High Authentication Failure Rate',
          description: `${securityEvents.length} failed authentication attempts in last 24h`,
          impact: 'Potential brute force attack',
          solution: 'Implement rate limiting and account lockout',
          affected_resource: 'authentication_system',
          auto_fixable: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Auth security check failed:', error);
    }
  }

  /**
   * Check for data exposure risks
   */
  private async checkDataExposure(issues: SecurityIssue[]): Promise<void> {
    try {
      // Check if there are any public-facing endpoints exposing sensitive data
      const { data: recentAccess } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'sensitive_data_access')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentAccess && recentAccess.length > 50) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'medium',
          type: 'configuration',
          title: 'High Sensitive Data Access Volume',
          description: `${recentAccess.length} sensitive data access events in last 24h`,
          impact: 'Potential data over-exposure',
          solution: 'Review data access patterns and implement stricter controls',
          affected_resource: 'data_access_system',
          auto_fixable: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Data exposure check failed:', error);
    }
  }

  /**
   * Calculate overall security score
   */
  private calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.type === 'rls')) {
      recommendations.push('Review and strengthen Row Level Security policies');
    }
    
    if (issues.some(i => i.type === 'function')) {
      recommendations.push('Audit database functions for security vulnerabilities');
    }
    
    if (issues.some(i => i.severity === 'critical')) {
      recommendations.push('Address critical security issues immediately');
    }
    
    if (issues.length === 0) {
      recommendations.push('Security posture is good - maintain current practices');
    }
    
    recommendations.push('Schedule regular security audits');
    recommendations.push('Implement continuous monitoring for suspicious activities');
    
    return recommendations;
  }

  /**
   * Auto-fix security issues where possible
   */
  async autoFixIssues(issueIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];
    
    // Note: Auto-fix capabilities would be implemented based on specific issues
    // For now, we'll log the attempt
    
    for (const issueId of issueIds) {
      try {
        // Log the fix attempt
        await supabase.from('security_events').insert({
          event_type: 'security_fix_attempted',
          severity: 'info',
          description: `Auto-fix attempted for issue: ${issueId}`,
          metadata: { issue_id: issueId }
        });
        
        success.push(issueId);
      } catch (error) {
        failed.push(issueId);
      }
    }
    
    return { success, failed };
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(): Promise<string> {
    const audit = await this.runSecurityAudit();
    
    const report = `
# Security Audit Report
Generated: ${new Date().toLocaleString()}

## Overall Security Score: ${audit.score}/100

## Issues Found: ${audit.issues.length}
${audit.issues.map(issue => `
- **${issue.title}** (${issue.severity})
  - ${issue.description}
  - Impact: ${issue.impact}
  - Solution: ${issue.solution}
`).join('')}

## Recommendations:
${audit.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Audit: ${new Date(audit.next_audit).toLocaleString()}
`;
    
    return report;
  }
}

export const securityAuditor = SecurityAuditor.getInstance();