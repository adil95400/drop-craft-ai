/// <reference types="cypress" />

describe('Stock & Price Monitoring', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });

    // Mock stock alerts API
    cy.intercept('GET', '**/rest/v1/stock_alerts*', {
      statusCode: 200,
      body: [
        {
          id: 'alert-1',
          product_id: 'prod-1',
          alert_type: 'low_stock',
          threshold: 10,
          current_value: 5,
          status: 'active',
          severity: 'warning',
          message: 'Stock bas pour Produit A',
          created_at: new Date().toISOString()
        },
        {
          id: 'alert-2',
          product_id: 'prod-2',
          alert_type: 'out_of_stock',
          threshold: 0,
          current_value: 0,
          status: 'active',
          severity: 'critical',
          message: 'Rupture de stock Produit B',
          created_at: new Date().toISOString()
        },
        {
          id: 'alert-3',
          product_id: 'prod-3',
          alert_type: 'price_drop',
          threshold: 15,
          current_value: 20,
          status: 'resolved',
          severity: 'info',
          message: 'Baisse de prix détectée',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getStockAlerts');

    cy.intercept('GET', '**/rest/v1/products*', {
      statusCode: 200,
      body: [
        { id: 'prod-1', title: 'Produit A', stock: 5, price: 29.99 },
        { id: 'prod-2', title: 'Produit B', stock: 0, price: 49.99 },
        { id: 'prod-3', title: 'Produit C', stock: 100, price: 19.99 }
      ]
    }).as('getProducts');
  });

  describe('Stock Alerts Dashboard', () => {
    it('should display alerts with stats', () => {
      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.contains('Alertes stock').should('be.visible');
      cy.contains('Total alertes').should('be.visible');
      cy.contains('Critiques').should('be.visible');
      cy.contains('Avertissements').should('be.visible');
    });

    it('should show different severity badges', () => {
      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.contains('Stock bas').should('be.visible');
      cy.contains('Rupture').should('be.visible');
    });

    it('should show empty state when no alerts', () => {
      cy.intercept('GET', '**/rest/v1/stock_alerts*', { body: [] }).as('emptyAlerts');
      cy.visit('/monitoring');
      cy.wait('@emptyAlerts');

      cy.contains('Aucune alerte').should('be.visible');
    });
  });

  describe('Alert Actions', () => {
    it('should resolve an alert', () => {
      cy.intercept('PATCH', '**/rest/v1/stock_alerts*', {
        statusCode: 200,
        body: { id: 'alert-1', status: 'resolved' }
      }).as('resolveAlert');

      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.get('[data-testid="resolve-alert"]').first().click();
      cy.wait('@resolveAlert');
      cy.contains('Alerte résolue').should('be.visible');
    });

    it('should dismiss an alert', () => {
      cy.intercept('PATCH', '**/rest/v1/stock_alerts*', {
        statusCode: 200,
        body: { id: 'alert-1', status: 'dismissed' }
      }).as('dismissAlert');

      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.get('[data-testid="dismiss-alert"]').first().click();
      cy.wait('@dismissAlert');
    });

    it('should navigate to product from alert', () => {
      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.get('[data-testid="view-product"]').first().click();
      cy.url().should('include', '/products');
    });
  });

  describe('Filter Alerts', () => {
    it('should filter alerts by type', () => {
      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.get('[data-testid="filter-type"]').click();
      cy.contains('Stock bas').click();

      cy.get('table tbody tr').should('have.length', 1);
    });

    it('should filter alerts by severity', () => {
      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.get('[data-testid="filter-severity"]').click();
      cy.contains('Critique').click();

      cy.contains('Rupture').should('be.visible');
    });

    it('should filter alerts by status', () => {
      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.get('[data-testid="filter-status"]').click();
      cy.contains('Résolues').click();

      cy.contains('Baisse de prix').should('be.visible');
    });
  });

  describe('Bulk Actions', () => {
    it('should select multiple alerts', () => {
      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.get('[data-testid="select-all"]').click();
      cy.get('[data-testid="bulk-actions"]').should('be.visible');
    });

    it('should resolve selected alerts', () => {
      cy.intercept('PATCH', '**/rest/v1/stock_alerts*', {
        statusCode: 200
      }).as('bulkResolve');

      cy.visit('/monitoring');
      cy.wait('@getStockAlerts');

      cy.get('[data-testid="select-all"]').click();
      cy.contains('Résoudre sélectionnées').click();
      cy.wait('@bulkResolve');
    });
  });

  describe('Alert Configuration', () => {
    it('should open alert settings', () => {
      cy.visit('/monitoring/settings');

      cy.contains('Configuration des alertes').should('be.visible');
      cy.contains('Seuil stock bas').should('be.visible');
    });

    it('should update alert thresholds', () => {
      cy.intercept('POST', '**/rest/v1/user_settings*', {
        statusCode: 200
      }).as('updateSettings');

      cy.visit('/monitoring/settings');

      cy.get('input[name="low_stock_threshold"]').clear().type('20');
      cy.contains('Sauvegarder').click();
      cy.wait('@updateSettings');
      cy.contains('Paramètres sauvegardés').should('be.visible');
    });
  });
});
