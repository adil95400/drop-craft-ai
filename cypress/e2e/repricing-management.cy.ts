/// <reference types="cypress" />

describe('Dynamic Repricing', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });

    // Mock pricing rules API
    cy.intercept('GET', '**/rest/v1/pricing_rules*', {
      statusCode: 200,
      body: [
        {
          id: 'rule-1',
          name: 'Marge minimum 20%',
          rule_type: 'margin_based',
          conditions: { min_margin: 20 },
          actions: { adjustment_type: 'percentage', value: 5 },
          is_active: true,
          priority: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 'rule-2',
          name: 'Promotion Black Friday',
          rule_type: 'competitor_based',
          conditions: { max_discount: 30 },
          actions: { adjustment_type: 'fixed', value: -10 },
          is_active: false,
          priority: 2,
          created_at: new Date().toISOString()
        }
      ]
    }).as('getPricingRules');

    cy.intercept('GET', '**/rest/v1/price_adjustments*', {
      statusCode: 200,
      body: [
        {
          id: 'adj-1',
          product_id: 'prod-1',
          old_price: 100,
          new_price: 95,
          adjustment_type: 'competitor_match',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getPriceAdjustments');
  });

  describe('Pricing Rules Dashboard', () => {
    it('should display pricing rules list', () => {
      cy.visit('/pricing');
      cy.wait('@getPricingRules');

      cy.contains('Règles de tarification').should('be.visible');
      cy.contains('Marge minimum 20%').should('be.visible');
      cy.contains('Promotion Black Friday').should('be.visible');
    });

    it('should show rule stats', () => {
      cy.visit('/pricing');
      cy.wait('@getPricingRules');

      cy.contains('Règles actives').should('be.visible');
      cy.contains('Règles inactives').should('be.visible');
    });

    it('should show empty state when no rules', () => {
      cy.intercept('GET', '**/rest/v1/pricing_rules*', { body: [] }).as('emptyRules');
      cy.visit('/pricing');
      cy.wait('@emptyRules');

      cy.contains('Aucune règle').should('be.visible');
    });
  });

  describe('Create Pricing Rule', () => {
    it('should open create rule dialog', () => {
      cy.visit('/pricing');
      cy.wait('@getPricingRules');

      cy.contains('Nouvelle règle').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('should create a margin-based rule', () => {
      cy.intercept('POST', '**/rest/v1/pricing_rules*', {
        statusCode: 201,
        body: { id: 'new-rule', name: 'Test Rule' }
      }).as('createRule');

      cy.visit('/pricing');
      cy.wait('@getPricingRules');

      cy.contains('Nouvelle règle').click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[name="name"]').type('Nouvelle règle test');
        cy.get('select[name="rule_type"]').select('margin_based');
        cy.get('input[name="min_margin"]').type('15');
        cy.contains('Créer').click();
      });

      cy.wait('@createRule');
      cy.contains('Règle créée').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.visit('/pricing');
      cy.wait('@getPricingRules');

      cy.contains('Nouvelle règle').click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Créer').click();
      });

      cy.contains('obligatoire').should('be.visible');
    });
  });

  describe('Toggle and Delete Rules', () => {
    it('should toggle rule active state', () => {
      cy.intercept('PATCH', '**/rest/v1/pricing_rules*', {
        statusCode: 200,
        body: { id: 'rule-1', is_active: false }
      }).as('toggleRule');

      cy.visit('/pricing');
      cy.wait('@getPricingRules');

      cy.get('[data-testid="toggle-rule"]').first().click();
      cy.wait('@toggleRule');
    });

    it('should delete a pricing rule', () => {
      cy.intercept('DELETE', '**/rest/v1/pricing_rules*', {
        statusCode: 204
      }).as('deleteRule');

      cy.visit('/pricing');
      cy.wait('@getPricingRules');

      cy.get('[data-testid="delete-rule"]').first().click();
      
      // Confirm deletion
      cy.contains('Confirmer').click();
      cy.wait('@deleteRule');
      cy.contains('Règle supprimée').should('be.visible');
    });
  });

  describe('Apply Pricing Rules', () => {
    it('should apply rules to products', () => {
      cy.intercept('POST', '**/rest/v1/rpc/apply_pricing_rules*', {
        statusCode: 200,
        body: { applied: 5, skipped: 2 }
      }).as('applyRules');

      cy.visit('/pricing');
      cy.wait('@getPricingRules');

      cy.contains('Appliquer les règles').click();
      cy.wait('@applyRules');
      cy.contains('règles appliquées').should('be.visible');
    });
  });

  describe('Price Adjustments History', () => {
    it('should display price adjustment history', () => {
      cy.visit('/pricing/history');
      cy.wait('@getPriceAdjustments');

      cy.contains('Historique des ajustements').should('be.visible');
      cy.contains('100').should('be.visible'); // old price
      cy.contains('95').should('be.visible'); // new price
    });
  });
});
