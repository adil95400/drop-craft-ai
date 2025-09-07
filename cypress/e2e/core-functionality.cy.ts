/// <reference types="cypress" />

describe('Core Application Functionality', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }));
    });
  });

  describe('Navigation', () => {
    it('should navigate between main sections', () => {
      cy.visit('/');
      
      // Test sidebar navigation
      cy.get('[data-cy="sidebar"]').should('be.visible');
      
      // Navigate to suppliers
      cy.get('[data-cy="nav-suppliers"]').click();
      cy.url().should('include', '/suppliers');
      cy.get('h1').should('contain', 'Fournisseurs');

      // Navigate to products
      cy.get('[data-cy="nav-products"]').click();
      cy.url().should('include', '/products');

      // Navigate to orders
      cy.get('[data-cy="nav-orders"]').click();
      cy.url().should('include', '/orders');

      // Navigate to analytics
      cy.get('[data-cy="nav-analytics"]').click();
      cy.url().should('include', '/analytics');
    });

    it('should handle responsive sidebar', () => {
      cy.visit('/');
      
      // Test mobile view
      cy.viewport('iphone-6');
      cy.get('[data-cy="mobile-menu-toggle"]').should('be.visible').click();
      cy.get('[data-cy="sidebar"]').should('be.visible');
      
      // Close mobile menu
      cy.get('[data-cy="mobile-menu-toggle"]').click();
    });
  });

  describe('Supplier Management', () => {
    it('should display suppliers list', () => {
      cy.visit('/suppliers');
      
      cy.get('[data-cy="suppliers-grid"]').should('be.visible');
      cy.get('[data-cy="add-supplier-btn"]').should('be.visible');
    });

    it('should open add supplier modal', () => {
      cy.visit('/suppliers');
      
      cy.get('[data-cy="add-supplier-btn"]').click();
      cy.get('[data-cy="supplier-modal"]').should('be.visible');
      cy.get('[data-cy="supplier-name-input"]').should('be.visible');
      
      // Close modal
      cy.get('[data-cy="modal-close"]').click();
      cy.get('[data-cy="supplier-modal"]').should('not.exist');
    });
  });

  describe('Product Import', () => {
    it('should handle product import flow', () => {
      cy.visit('/products/import');
      
      cy.get('[data-cy="import-type-select"]').should('be.visible');
      cy.get('[data-cy="import-type-select"]').click();
      cy.get('[data-cy="import-csv"]').click();
      
      cy.get('[data-cy="file-upload-zone"]').should('be.visible');
    });
  });

  describe('Order Management', () => {
    it('should display orders dashboard', () => {
      cy.visit('/orders');
      
      cy.get('[data-cy="orders-stats"]').should('be.visible');
      cy.get('[data-cy="orders-table"]').should('be.visible');
    });

    it('should filter orders by status', () => {
      cy.visit('/orders');
      
      cy.get('[data-cy="status-filter"]').should('be.visible');
      cy.get('[data-cy="status-filter"]').select('pending');
      
      // Should update the orders list
      cy.get('[data-cy="orders-table"]').should('be.visible');
    });
  });

  describe('Analytics Dashboard', () => {
    it('should load analytics data', () => {
      cy.visit('/analytics');
      
      cy.get('[data-cy="revenue-chart"]').should('be.visible');
      cy.get('[data-cy="orders-chart"]').should('be.visible');
      cy.get('[data-cy="top-products"]').should('be.visible');
    });

    it('should change date range', () => {
      cy.visit('/analytics');
      
      cy.get('[data-cy="date-range-picker"]').click();
      cy.get('[data-cy="last-30-days"]').click();
      
      // Charts should update
      cy.get('[data-cy="revenue-chart"]').should('be.visible');
    });
  });

  describe('Settings and Integrations', () => {
    it('should access billing settings', () => {
      cy.visit('/billing');
      
      cy.get('[data-cy="subscription-status"]').should('be.visible');
      cy.get('[data-cy="plans-grid"]').should('be.visible');
    });

    it('should manage integrations', () => {
      cy.visit('/integrations');
      
      cy.get('[data-cy="integrations-list"]').should('be.visible');
      cy.get('[data-cy="add-integration-btn"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API calls and return errors
      cy.intercept('GET', '**/api/**', { statusCode: 500 }).as('apiError');
      
      cy.visit('/suppliers');
      
      // Should show error message
      cy.get('[data-cy="error-message"]').should('be.visible');
      cy.get('[data-cy="retry-btn"]').should('be.visible');
    });

    it('should handle 404 pages', () => {
      cy.visit('/non-existent-page');
      
      cy.get('[data-cy="404-page"]').should('be.visible');
      cy.get('[data-cy="back-home-btn"]').should('be.visible');
    });
  });
});

describe('Form Validations', () => {
  it('should validate supplier form', () => {
    cy.visit('/suppliers');
    
    cy.get('[data-cy="add-supplier-btn"]').click();
    cy.get('[data-cy="submit-btn"]').click();
    
    // Should show validation errors
    cy.get('[data-cy="name-error"]').should('contain', 'requis');
    cy.get('[data-cy="url-error"]').should('be.visible');
  });

  it('should validate product form', () => {
    cy.visit('/products/add');
    
    cy.get('[data-cy="submit-btn"]').click();
    
    // Should show validation errors
    cy.get('[data-cy="product-name-error"]').should('be.visible');
    cy.get('[data-cy="price-error"]').should('be.visible');
  });
});

describe('Performance Tests', () => {
  it('should load main pages within acceptable time', () => {
    const pages = ['/', '/suppliers', '/products', '/orders', '/analytics'];
    
    pages.forEach(page => {
      const start = Date.now();
      cy.visit(page);
      cy.get('main').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds max
      });
    });
  });
});