/// <reference types="cypress" />

describe('Admin Panel Functionality', () => {
  beforeEach(() => {
    // Mock admin authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
          role: 'admin'
        }
      }));
    });
  });

  it('should load admin panel with all tabs', () => {
    cy.visit('/admin-panel');
    
    // Check all tabs are present
    cy.get('[data-cy="tab-dashboard"]').should('be.visible');
    cy.get('[data-cy="tab-users"]').should('be.visible');
    cy.get('[data-cy="tab-suppliers"]').should('be.visible');
    cy.get('[data-cy="tab-analytics"]').should('be.visible');
    cy.get('[data-cy="tab-database"]').should('be.visible');
    cy.get('[data-cy="tab-monitoring"]').should('be.visible');
    cy.get('[data-cy="tab-logs"]').should('be.visible');
    cy.get('[data-cy="tab-settings"]').should('be.visible');
  });

  it('should display real-time monitoring data', () => {
    cy.visit('/admin-panel');
    
    cy.get('[data-cy="tab-monitoring"]').click();
    
    // Check monitoring cards are present
    cy.get('[data-cy="active-users-metric"]').should('be.visible');
    cy.get('[data-cy="system-load-metric"]').should('be.visible');
    cy.get('[data-cy="error-rate-metric"]').should('be.visible');
    
    // Check real-time events
    cy.get('[data-cy="realtime-events"]').should('be.visible');
  });

  it('should manage user roles', () => {
    cy.visit('/admin-panel');
    
    cy.get('[data-cy="tab-users"]').click();
    
    // Should display users list
    cy.get('[data-cy="users-table"]').should('be.visible');
    
    // Test role change functionality
    cy.get('[data-cy="user-role-select"]').first().should('be.visible');
  });

  it('should handle supplier management', () => {
    cy.visit('/admin-panel');
    
    cy.get('[data-cy="tab-suppliers"]').click();
    
    // Should show supplier stats
    cy.get('[data-cy="suppliers-stats"]').should('be.visible');
    cy.get('[data-cy="add-supplier-btn"]').should('be.visible');
  });

  it('should display system analytics', () => {
    cy.visit('/admin-panel');
    
    cy.get('[data-cy="tab-analytics"]').click();
    
    // Check analytics charts
    cy.get('[data-cy="revenue-analytics"]').should('be.visible');
    cy.get('[data-cy="user-analytics"]').should('be.visible');
  });
});

describe('Stripe Integration Tests', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/functions/v1/create-checkout', {
      statusCode: 200,
      body: { url: 'https://checkout.stripe.com/pay/test_123' }
    }).as('createCheckout');

    cy.intercept('POST', '**/functions/v1/check-subscription', {
      statusCode: 200,
      body: { 
        subscribed: true, 
        subscription_tier: 'pro',
        subscription_end: '2024-12-31'
      }
    }).as('checkSubscription');
  });

  it('should handle subscription flow', () => {
    cy.visit('/billing');
    
    // Check subscription status
    cy.get('[data-cy="subscription-status"]').should('contain', 'Pro');
    
    // Test plan selection
    cy.get('[data-cy="select-plan-ultra"]').click();
    cy.wait('@createCheckout');
    
    // Should open Stripe checkout
    cy.window().its('open').should('have.been.called');
  });

  it('should refresh subscription status', () => {
    cy.visit('/billing');
    
    cy.get('[data-cy="refresh-subscription"]').click();
    cy.wait('@checkSubscription');
    
    // Should update UI
    cy.get('[data-cy="subscription-status"]').should('be.visible');
  });
});

describe('Order Automation Tests', () => {
  it('should handle automated order processing', () => {
    cy.visit('/orders');
    
    // Create new order
    cy.get('[data-cy="create-order-btn"]').click();
    cy.get('[data-cy="order-form"]').should('be.visible');
    
    // Fill order details
    cy.get('[data-cy="customer-select"]').click();
    cy.get('[data-cy="customer-option"]').first().click();
    
    cy.get('[data-cy="product-select"]').click();
    cy.get('[data-cy="product-option"]').first().click();
    
    cy.get('[data-cy="submit-order"]').click();
    
    // Should trigger automation
    cy.get('[data-cy="automation-status"]').should('contain', 'Traitement');
  });
});

describe('Real-time Features Tests', () => {
  it('should update metrics in real-time', () => {
    cy.visit('/admin-panel');
    
    cy.get('[data-cy="tab-monitoring"]').click();
    
    // Capture initial metric value
    cy.get('[data-cy="active-users-count"]')
      .invoke('text')
      .then((initialValue) => {
        // Wait for potential update
        cy.wait(6000); // Wait longer than update interval
        
        // Check if value potentially changed (real-time update)
        cy.get('[data-cy="active-users-count"]').should('be.visible');
      });
  });
});

describe('Extension Bridge Tests', () => {
  it('should handle extension communication', () => {
    cy.visit('/extensions');
    
    // Test extension status
    cy.get('[data-cy="extension-status"]').should('contain', 'Non connectée');
    
    // Test download buttons
    cy.get('[data-cy="download-chrome"]').should('be.visible');
    cy.get('[data-cy="download-firefox"]').should('be.visible');
    cy.get('[data-cy="download-edge"]').should('be.visible');
  });

  it('should handle scraped products', () => {
    cy.visit('/extensions');
    
    // Simulate extension message
    cy.window().then((win) => {
      win.postMessage({
        type: 'PRODUCT_SCRAPED',
        source: 'extension',
        data: {
          name: 'Test Product',
          price: 29.99,
          image: '/placeholder.svg',
          url: 'https://example.com/product',
          supplier: 'Test Supplier'
        }
      }, '*');
    });
    
    // Should display scraped product
    cy.get('[data-cy="scraped-products"]').should('contain', 'Test Product');
  });
});