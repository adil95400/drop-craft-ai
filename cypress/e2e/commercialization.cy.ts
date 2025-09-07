describe('Commercialization Features E2E Tests', () => {
  beforeEach(() => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: { user: { id: 'test-user-id' } }
      }));
    });
  });

  describe('Billing Management', () => {
    it('should display billing page with plan information', () => {
      cy.visit('/modern/billing');
      cy.get('[data-testid="billing-page"]').should('be.visible');
      cy.contains('Gestion de la Facturation').should('be.visible');
      cy.get('[data-testid="current-plan"]').should('be.visible');
    });

    it('should show quota usage and limits', () => {
      cy.visit('/modern/billing');
      cy.get('[data-testid="quota-usage"]').should('be.visible');
      cy.contains('Utilisation des Quotas').should('be.visible');
    });

    it('should allow plan upgrade', () => {
      cy.visit('/modern/billing');
      cy.get('[data-testid="upgrade-plan-btn"]').should('be.visible');
      cy.get('[data-testid="upgrade-plan-btn"]').click();
      // Should show upgrade modal or redirect to Stripe
    });
  });

  describe('Product Catalog Management', () => {
    it('should display catalog page with product list', () => {
      cy.visit('/catalog');
      cy.get('[data-testid="catalog-page"]').should('be.visible');
      cy.contains('Catalogue Produits').should('be.visible');
      cy.get('[data-testid="product-grid"]').should('be.visible');
    });

    it('should allow switching between grid and list view', () => {
      cy.visit('/catalog');
      cy.get('[data-testid="view-toggle-grid"]').should('be.visible');
      cy.get('[data-testid="view-toggle-list"]').should('be.visible');
      
      cy.get('[data-testid="view-toggle-list"]').click();
      cy.get('[data-testid="product-list"]').should('be.visible');
      
      cy.get('[data-testid="view-toggle-grid"]').click();
      cy.get('[data-testid="product-grid"]').should('be.visible');
    });

    it('should open product editor modal', () => {
      cy.visit('/catalog');
      cy.get('[data-testid="add-product-btn"]').click();
      cy.get('[data-testid="product-editor-modal"]').should('be.visible');
      cy.contains('Nouveau Produit').should('be.visible');
    });

    it('should navigate through product editor tabs', () => {
      cy.visit('/catalog');
      cy.get('[data-testid="add-product-btn"]').click();
      
      // Test all tabs are present
      cy.get('[data-testid="tab-info"]').should('be.visible');
      cy.get('[data-testid="tab-pricing"]').should('be.visible');
      cy.get('[data-testid="tab-seo"]').should('be.visible');
      cy.get('[data-testid="tab-ai"]').should('be.visible');
      
      // Test tab navigation
      cy.get('[data-testid="tab-pricing"]').click();
      cy.contains('Gestion des Prix').should('be.visible');
      
      cy.get('[data-testid="tab-seo"]').click();
      cy.contains('Optimisation SEO').should('be.visible');
    });

    it('should generate AI content for products', () => {
      cy.visit('/catalog');
      cy.get('[data-testid="add-product-btn"]').click();
      cy.get('[data-testid="tab-ai"]').click();
      
      cy.get('[data-testid="generate-description-btn"]').should('be.visible');
      cy.get('[data-testid="generate-seo-btn"]').should('be.visible');
    });
  });

  describe('CRM Management', () => {
    it('should display CRM dashboard with key metrics', () => {
      cy.visit('/crm');
      cy.get('[data-testid="crm-page"]').should('be.visible');
      cy.contains('Customer Relationship Management').should('be.visible');
      cy.get('[data-testid="crm-metrics"]').should('be.visible');
    });

    it('should show contact list and allow filtering', () => {
      cy.visit('/crm');
      cy.get('[data-testid="contacts-tab"]').click();
      cy.get('[data-testid="contacts-list"]').should('be.visible');
      cy.get('[data-testid="contact-search"]').should('be.visible');
    });

    it('should display lead scoring system', () => {
      cy.visit('/crm');
      cy.get('[data-testid="contacts-tab"]').click();
      cy.get('[data-testid="lead-score"]').should('be.visible');
    });

    it('should show marketing campaigns section', () => {
      cy.visit('/crm');
      cy.get('[data-testid="campaigns-tab"]').click();
      cy.get('[data-testid="campaigns-list"]').should('be.visible');
      cy.get('[data-testid="create-campaign-btn"]').should('be.visible');
    });

    it('should display analytics and reports', () => {
      cy.visit('/crm');
      cy.get('[data-testid="analytics-tab"]').click();
      cy.get('[data-testid="crm-analytics"]').should('be.visible');
      cy.get('[data-testid="performance-chart"]').should('be.visible');
    });
  });

  describe('System Monitoring', () => {
    it('should display monitoring dashboard', () => {
      cy.visit('/monitoring');
      cy.get('[data-testid="monitoring-page"]').should('be.visible');
      cy.contains('Monitoring & Analytics').should('be.visible');
    });

    it('should show system health metrics', () => {
      cy.visit('/monitoring');
      cy.get('[data-testid="system-health"]').should('be.visible');
      cy.contains('Système').should('be.visible');
      cy.contains('Performance').should('be.visible');
    });

    it('should display performance charts', () => {
      cy.visit('/monitoring');
      cy.get('[data-testid="performance-tab"]').click();
      cy.get('[data-testid="response-time-chart"]').should('be.visible');
      cy.get('[data-testid="throughput-chart"]').should('be.visible');
    });

    it('should show business metrics', () => {
      cy.visit('/monitoring');
      cy.get('[data-testid="business-tab"]').click();
      cy.get('[data-testid="revenue-metrics"]').should('be.visible');
      cy.get('[data-testid="business-chart"]').should('be.visible');
    });

    it('should display integration status', () => {
      cy.visit('/monitoring');
      cy.get('[data-testid="integrations-tab"]').click();
      cy.get('[data-testid="integrations-status"]').should('be.visible');
    });

    it('should show active alerts', () => {
      cy.visit('/monitoring');
      cy.get('[data-testid="alerts-tab"]').click();
      cy.get('[data-testid="alerts-list"]').should('be.visible');
    });
  });

  describe('Integration Health', () => {
    it('should test all third-party integrations', () => {
      // Test Shopify integration
      cy.request('POST', '/functions/v1/shopify-sync', {
        action: 'test_connection'
      }).then((response) => {
        expect(response.status).to.eq(200);
      });

      // Test WooCommerce integration
      cy.request('POST', '/functions/v1/woocommerce-sync', {
        action: 'test_connection'
      }).then((response) => {
        expect(response.status).to.eq(200);
      });

      // Test PrestaShop integration
      cy.request('POST', '/functions/v1/prestashop-sync', {
        action: 'test_connection'
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('should test order automation workflows', () => {
      cy.request('POST', '/functions/v1/order-automation', {
        action: 'test_workflow',
        workflow_id: 'test-workflow'
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
      });
    });

    it('should test cron sync functionality', () => {
      cy.request('POST', '/functions/v1/cron-sync', {
        sync_type: 'all_integrations'
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
      });
    });
  });

  describe('End-to-End Business Flow', () => {
    it('should complete full product import and management flow', () => {
      // 1. Visit catalog and add new product
      cy.visit('/catalog');
      cy.get('[data-testid="add-product-btn"]').click();
      
      // 2. Fill product information
      cy.get('[data-testid="product-name"]').type('Test Product E2E');
      cy.get('[data-testid="product-description"]').type('Test product description for E2E testing');
      
      // 3. Set pricing
      cy.get('[data-testid="tab-pricing"]').click();
      cy.get('[data-testid="product-price"]').type('99.99');
      cy.get('[data-testid="cost-price"]').type('49.99');
      
      // 4. Configure SEO
      cy.get('[data-testid="tab-seo"]').click();
      cy.get('[data-testid="seo-title"]').type('Test Product - Best Quality');
      cy.get('[data-testid="seo-description"]').type('High-quality test product for automated testing');
      
      // 5. Save product
      cy.get('[data-testid="save-product-btn"]').click();
      cy.contains('Produit créé avec succès').should('be.visible');
    });

    it('should test complete CRM workflow', () => {
      // 1. Add new contact
      cy.visit('/crm');
      cy.get('[data-testid="contacts-tab"]').click();
      cy.get('[data-testid="add-contact-btn"]').click();
      
      // 2. Fill contact information
      cy.get('[data-testid="contact-name"]').type('Test Customer E2E');
      cy.get('[data-testid="contact-email"]').type('test-e2e@example.com');
      cy.get('[data-testid="contact-phone"]').type('+33123456789');
      
      // 3. Save contact
      cy.get('[data-testid="save-contact-btn"]').click();
      cy.contains('Contact ajouté avec succès').should('be.visible');
      
      // 4. Verify contact appears in list
      cy.get('[data-testid="contacts-list"]').should('contain', 'Test Customer E2E');
    });

    it('should verify billing and quota management', () => {
      // 1. Check current usage
      cy.visit('/modern/billing');
      cy.get('[data-testid="quota-usage"]').should('be.visible');
      
      // 2. Verify plan limits are displayed
      cy.get('[data-testid="plan-limits"]').should('be.visible');
      
      // 3. Test upgrade flow
      cy.get('[data-testid="upgrade-plan-btn"]').should('be.visible');
    });
  });
});