/// <reference types="cypress" />

describe('Returns Management (RMA)', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });

    // Mock returns API
    cy.intercept('GET', '**/rest/v1/returns*', {
      statusCode: 200,
      body: [
        {
          id: 'return-1',
          rma_number: 'RMA-2024-0001',
          order_id: 'order-1',
          customer_email: 'client@example.com',
          reason: 'defective',
          status: 'pending',
          items: [{ product_id: 'prod-1', quantity: 1, reason: 'Produit défectueux' }],
          created_at: new Date().toISOString()
        },
        {
          id: 'return-2',
          rma_number: 'RMA-2024-0002',
          order_id: 'order-2',
          customer_email: 'autre@example.com',
          reason: 'wrong_item',
          status: 'approved',
          items: [{ product_id: 'prod-2', quantity: 2, reason: 'Mauvais article' }],
          created_at: new Date().toISOString()
        }
      ]
    }).as('getReturns');

    cy.intercept('GET', '**/rest/v1/orders*', {
      statusCode: 200,
      body: [
        { id: 'order-1', order_number: 'CMD-001', status: 'delivered' },
        { id: 'order-2', order_number: 'CMD-002', status: 'delivered' }
      ]
    }).as('getOrders');
  });

  describe('Returns List Display', () => {
    it('should display returns list with stats', () => {
      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      // Check stats cards are visible
      cy.contains('Total retours').should('be.visible');
      cy.contains('En attente').should('be.visible');
      cy.contains('Approuvés').should('be.visible');
      cy.contains('Remboursés').should('be.visible');
    });

    it('should display returns in table format', () => {
      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      // Check table headers
      cy.contains('N° RMA').should('be.visible');
      cy.contains('Client').should('be.visible');
      cy.contains('Statut').should('be.visible');
      cy.contains('Actions').should('be.visible');
    });

    it('should show empty state when no returns', () => {
      cy.intercept('GET', '**/rest/v1/returns*', { body: [] }).as('emptyReturns');
      cy.visit('/orders/returns');
      cy.wait('@emptyReturns');

      cy.contains('Aucun retour').should('be.visible');
    });
  });

  describe('Create Return', () => {
    it('should open create return dialog', () => {
      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      cy.contains('Nouveau retour').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Créer une demande de retour').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      cy.contains('Nouveau retour').click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Créer le retour').click();
      });

      // Should show validation errors
      cy.contains('obligatoire').should('be.visible');
    });

    it('should create a new return successfully', () => {
      cy.intercept('POST', '**/rest/v1/returns*', {
        statusCode: 201,
        body: { id: 'new-return', rma_number: 'RMA-2024-0003' }
      }).as('createReturn');

      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      cy.contains('Nouveau retour').click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[placeholder*="email"]').type('nouveau@client.com');
        cy.get('textarea').first().type('Produit ne correspond pas');
        cy.contains('Créer le retour').click();
      });

      cy.wait('@createReturn');
      cy.contains('Retour créé').should('be.visible');
    });
  });

  describe('Return Actions', () => {
    it('should view return details', () => {
      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      cy.contains('RMA-2024-0001').click();
      cy.get('[role="dialog"], [data-state="open"]').should('be.visible');
    });

    it('should approve a pending return', () => {
      cy.intercept('PATCH', '**/rest/v1/returns*', {
        statusCode: 200,
        body: { id: 'return-1', status: 'approved' }
      }).as('updateReturn');

      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      cy.get('[data-testid="approve-return"]').first().click();
      cy.wait('@updateReturn');
      cy.contains('approuvé').should('be.visible');
    });

    it('should reject a pending return', () => {
      cy.intercept('PATCH', '**/rest/v1/returns*', {
        statusCode: 200,
        body: { id: 'return-1', status: 'rejected' }
      }).as('rejectReturn');

      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      cy.get('[data-testid="reject-return"]').first().click();
      cy.wait('@rejectReturn');
    });
  });

  describe('Filter and Search', () => {
    it('should filter returns by status', () => {
      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      cy.get('select, [role="combobox"]').first().click();
      cy.contains('En attente').click();

      // Should filter the list
      cy.get('table tbody tr').should('have.length.at.least', 1);
    });

    it('should search returns by RMA number', () => {
      cy.visit('/orders/returns');
      cy.wait('@getReturns');

      cy.get('input[placeholder*="Rechercher"]').type('RMA-2024-0001');
      cy.contains('RMA-2024-0001').should('be.visible');
    });
  });
});
