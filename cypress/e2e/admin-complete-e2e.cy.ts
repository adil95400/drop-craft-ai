/// <reference types="cypress" />

describe('Complete Admin System E2E Tests', () => {
  beforeEach(() => {
    // Setup admin authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: {
          id: 'admin-user-id',
          email: 'admin@test.com',
          role: 'admin'
        }
      }));
    });
  });

  describe('Admin Dashboard Analytics', () => {
    it('should display comprehensive dashboard metrics', () => {
      cy.visit('/admin');
      
      // Check main metrics cards
      cy.get('[data-testid="total-users-metric"]').should('be.visible');
      cy.get('[data-testid="total-orders-metric"]').should('be.visible');
      cy.get('[data-testid="total-products-metric"]').should('be.visible');
      cy.get('[data-testid="revenue-metric"]').should('be.visible');
      
      // Check system status indicators
      cy.get('[data-testid="system-status"]').should('contain', 'Opérationnel');
      cy.get('[data-testid="database-status"]').should('be.visible');
      cy.get('[data-testid="api-status"]').should('be.visible');
    });

    it('should handle real-time updates', () => {
      cy.visit('/admin');
      
      // Check for real-time elements
      cy.get('[data-testid="realtime-users"]').should('be.visible');
      cy.get('[data-testid="realtime-orders"]').should('be.visible');
      
      // Simulate real-time update
      cy.window().then((win) => {
        win.postMessage({
          type: 'REALTIME_UPDATE',
          data: { activeUsers: 150, newOrders: 3 }
        }, '*');
      });
      
      // Check update is reflected
      cy.wait(1000);
      cy.get('[data-testid="realtime-users"]').should('be.visible');
    });
  });

  describe('User Management System', () => {
    it('should manage user roles comprehensively', () => {
      cy.visit('/admin/users');
      
      // Check users table loads
      cy.get('[data-testid="users-table"]').should('be.visible');
      cy.get('[data-testid="search-users"]').should('be.visible');
      
      // Test user search
      cy.get('[data-testid="search-users"]').type('test@example.com');
      cy.get('[data-testid="users-table"] tbody tr').should('have.length.at.least', 0);
      
      // Test role change functionality
      cy.get('[data-testid="user-role-dropdown"]').first().click();
      cy.get('[data-testid="role-option-admin"]').click();
      
      // Should show confirmation dialog
      cy.get('[data-testid="role-change-confirm"]').should('be.visible');
      cy.get('[data-testid="confirm-role-change"]').click();
      
      // Should show success message
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });

    it('should handle user suspension and reactivation', () => {
      cy.visit('/admin/users');
      
      // Test user suspension
      cy.get('[data-testid="user-actions-menu"]').first().click();
      cy.get('[data-testid="suspend-user"]').click();
      
      // Confirm suspension
      cy.get('[data-testid="suspension-reason"]').type('Policy violation');
      cy.get('[data-testid="confirm-suspension"]').click();
      
      // Check success
      cy.get('[data-testid="success-toast"]').should('contain', 'utilisateur suspendu');
    });

    it('should force disconnect users', () => {
      cy.visit('/admin/users');
      
      // Force disconnect
      cy.get('[data-testid="user-actions-menu"]').first().click();
      cy.get('[data-testid="force-disconnect"]').click();
      
      // Confirm action
      cy.get('[data-testid="disconnect-reason"]').type('Security concern');
      cy.get('[data-testid="confirm-disconnect"]').click();
      
      // Verify action
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });
  });

  describe('Security Management', () => {
    it('should run security audit', () => {
      cy.visit('/admin/security');
      
      // Start security audit
      cy.get('[data-testid="run-security-audit"]').click();
      
      // Wait for audit to complete
      cy.get('[data-testid="audit-progress"]').should('be.visible');
      cy.get('[data-testid="audit-results"]', { timeout: 10000 }).should('be.visible');
      
      // Check audit results
      cy.get('[data-testid="security-score"]').should('be.visible');
      cy.get('[data-testid="critical-issues"]').should('be.visible');
      cy.get('[data-testid="audit-recommendations"]').should('be.visible');
    });

    it('should view security events log', () => {
      cy.visit('/admin/security');
      
      // Check security events
      cy.get('[data-testid="security-events-tab"]').click();
      cy.get('[data-testid="security-events-table"]').should('be.visible');
      
      // Filter by severity
      cy.get('[data-testid="severity-filter"]').select('critical');
      cy.get('[data-testid="filter-events"]').click();
      
      // Check filtered results
      cy.get('[data-testid="security-events-table"] tbody tr').should('be.visible');
    });

    it('should handle security alerts', () => {
      cy.visit('/admin/security');
      
      // Check for active alerts
      cy.get('[data-testid="security-alerts"]').should('be.visible');
      
      // Test alert acknowledgment
      cy.get('[data-testid="acknowledge-alert"]').first().click();
      cy.get('[data-testid="alert-acknowledged"]').should('be.visible');
    });
  });

  describe('System Monitoring', () => {
    it('should display system health metrics', () => {
      cy.visit('/admin/monitoring');
      
      // Check health metrics
      cy.get('[data-testid="cpu-usage"]').should('be.visible');
      cy.get('[data-testid="memory-usage"]').should('be.visible');
      cy.get('[data-testid="database-connections"]').should('be.visible');
      cy.get('[data-testid="api-response-time"]').should('be.visible');
      
      // Check health status indicators
      cy.get('[data-testid="system-health-score"]').should('be.visible');
      cy.get('[data-testid="uptime-display"]').should('be.visible');
    });

    it('should handle system alerts and notifications', () => {
      cy.visit('/admin/monitoring');
      
      // Test alert configuration
      cy.get('[data-testid="configure-alerts"]').click();
      cy.get('[data-testid="alert-threshold-cpu"]').clear().type('80');
      cy.get('[data-testid="alert-threshold-memory"]').clear().type('85');
      cy.get('[data-testid="save-alert-config"]').click();
      
      // Verify configuration saved
      cy.get('[data-testid="config-saved-toast"]').should('be.visible');
    });
  });

  describe('Data Management', () => {
    it('should perform database backup', () => {
      cy.visit('/admin/database');
      
      // Initiate backup
      cy.get('[data-testid="create-backup"]').click();
      cy.get('[data-testid="backup-description"]').type('Manual backup before update');
      cy.get('[data-testid="confirm-backup"]').click();
      
      // Check backup progress
      cy.get('[data-testid="backup-progress"]').should('be.visible');
      cy.get('[data-testid="backup-complete"]', { timeout: 30000 }).should('be.visible');
    });

    it('should restore from backup', () => {
      cy.visit('/admin/database');
      
      // Select backup to restore
      cy.get('[data-testid="backup-list"]').should('be.visible');
      cy.get('[data-testid="backup-item"]').first().click();
      cy.get('[data-testid="restore-backup"]').click();
      
      // Confirm restoration
      cy.get('[data-testid="confirm-restore"]').click();
      
      // Wait for restoration
      cy.get('[data-testid="restore-progress"]').should('be.visible');
    });

    it('should export system data', () => {
      cy.visit('/admin/database');
      
      // Export data
      cy.get('[data-testid="export-data"]').click();
      cy.get('[data-testid="select-tables"]').click();
      cy.get('[data-testid="table-users"]').check();
      cy.get('[data-testid="table-orders"]').check();
      cy.get('[data-testid="start-export"]').click();
      
      // Check export progress
      cy.get('[data-testid="export-progress"]').should('be.visible');
    });
  });

  describe('Performance Optimization', () => {
    it('should analyze system performance', () => {
      cy.visit('/admin/performance');
      
      // Run performance analysis
      cy.get('[data-testid="analyze-performance"]').click();
      
      // Check analysis results
      cy.get('[data-testid="performance-score"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-testid="slow-queries"]').should('be.visible');
      cy.get('[data-testid="optimization-suggestions"]').should('be.visible');
    });

    it('should optimize database queries', () => {
      cy.visit('/admin/performance');
      
      // Apply optimizations
      cy.get('[data-testid="optimize-queries"]').click();
      cy.get('[data-testid="confirm-optimization"]').click();
      
      // Check optimization results
      cy.get('[data-testid="optimization-complete"]').should('be.visible');
    });
  });

  describe('Integration Management', () => {
    it('should manage API integrations', () => {
      cy.visit('/admin/integrations');
      
      // Check existing integrations
      cy.get('[data-testid="integrations-list"]').should('be.visible');
      
      // Add new integration
      cy.get('[data-testid="add-integration"]').click();
      cy.get('[data-testid="integration-type"]').select('shopify');
      cy.get('[data-testid="integration-name"]').type('Test Store');
      cy.get('[data-testid="api-key"]').type('test-api-key');
      cy.get('[data-testid="save-integration"]').click();
      
      // Verify integration added
      cy.get('[data-testid="integration-added-toast"]').should('be.visible');
    });

    it('should test integration connectivity', () => {
      cy.visit('/admin/integrations');
      
      // Test connection
      cy.get('[data-testid="test-connection"]').first().click();
      
      // Check connection status
      cy.get('[data-testid="connection-status"]').should('contain', 'Connecté');
    });
  });

  describe('Audit Trail', () => {
    it('should view comprehensive audit logs', () => {
      cy.visit('/admin/audit');
      
      // Check audit log table
      cy.get('[data-testid="audit-log-table"]').should('be.visible');
      
      // Filter audit logs
      cy.get('[data-testid="date-range-picker"]').click();
      cy.get('[data-testid="last-7-days"]').click();
      cy.get('[data-testid="action-filter"]').select('user_role_change');
      cy.get('[data-testid="apply-filters"]').click();
      
      // Check filtered results
      cy.get('[data-testid="audit-log-table"] tbody tr').should('be.visible');
    });

    it('should export audit logs', () => {
      cy.visit('/admin/audit');
      
      // Export logs
      cy.get('[data-testid="export-audit-logs"]').click();
      cy.get('[data-testid="export-format"]').select('csv');
      cy.get('[data-testid="start-export"]').click();
      
      // Verify export
      cy.get('[data-testid="export-complete"]').should('be.visible');
    });
  });

  describe('System Configuration', () => {
    it('should manage system settings', () => {
      cy.visit('/admin/settings');
      
      // Update system settings
      cy.get('[data-testid="max-upload-size"]').clear().type('10');
      cy.get('[data-testid="session-timeout"]').clear().type('30');
      cy.get('[data-testid="enable-2fa"]').check();
      cy.get('[data-testid="save-settings"]').click();
      
      // Verify settings saved
      cy.get('[data-testid="settings-saved-toast"]').should('be.visible');
    });

    it('should manage API rate limits', () => {
      cy.visit('/admin/settings');
      
      // Configure rate limits
      cy.get('[data-testid="rate-limits-tab"]').click();
      cy.get('[data-testid="requests-per-minute"]').clear().type('100');
      cy.get('[data-testid="requests-per-hour"]').clear().type('5000');
      cy.get('[data-testid="save-rate-limits"]').click();
      
      // Verify configuration
      cy.get('[data-testid="rate-limits-saved"]').should('be.visible');
    });
  });

  describe('Emergency Procedures', () => {
    it('should handle system maintenance mode', () => {
      cy.visit('/admin/emergency');
      
      // Enable maintenance mode
      cy.get('[data-testid="enable-maintenance"]').click();
      cy.get('[data-testid="maintenance-message"]').type('System maintenance in progress');
      cy.get('[data-testid="confirm-maintenance"]').click();
      
      // Verify maintenance mode
      cy.get('[data-testid="maintenance-active"]').should('be.visible');
    });

    it('should perform emergency system shutdown', () => {
      cy.visit('/admin/emergency');
      
      // Emergency shutdown
      cy.get('[data-testid="emergency-shutdown"]').click();
      cy.get('[data-testid="shutdown-reason"]').type('Security incident');
      cy.get('[data-testid="confirm-shutdown"]').click();
      
      // Verify shutdown initiated
      cy.get('[data-testid="shutdown-initiated"]').should('be.visible');
    });
  });
});