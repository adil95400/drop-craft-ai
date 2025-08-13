describe('Button Functionality Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Navigation Buttons', () => {
    it('should navigate to import page when clicking import button', () => {
      cy.get('[data-testid="import-button"]').click()
      cy.url().should('include', '/import')
    })

    it('should navigate to orders page when clicking orders button', () => {
      cy.get('[data-testid="orders-button"]').click()
      cy.url().should('include', '/orders')
    })

    it('should navigate to tracking page when clicking tracking button', () => {
      cy.get('[data-testid="tracking-button"]').click()
      cy.url().should('include', '/tracking')
    })
  })

  describe('Action Buttons', () => {
    it('should show loading state and success message for sync button', () => {
      cy.visit('/orders-ultra-pro')
      
      cy.get('[data-testid="sync-button"]').click()
      cy.get('[data-testid="sync-button"]').should('contain', 'Synchronisation...')
      cy.get('[data-testid="sync-button"]').should('be.disabled')
      
      cy.wait(1000)
      cy.get('.toast').should('contain', 'Synchronisation temps réel activée')
    })

    it('should show loading state for AI analysis button', () => {
      cy.visit('/orders-ultra-pro')
      
      cy.get('[data-testid="ai-analysis-button"]').click()
      cy.get('[data-testid="ai-analysis-button"]').should('contain', 'Analyse en cours...')
      cy.get('[data-testid="ai-analysis-button"]').should('be.disabled')
      
      cy.wait(2000)
      cy.get('.toast').should('contain', 'Analyse IA des tendances terminée')
    })
  })

  describe('Modal Buttons', () => {
    it('should open create order modal when clicking new order button', () => {
      cy.visit('/orders-ultra-pro')
      
      cy.get('[data-testid="new-order-button"]').click()
      cy.get('[data-testid="create-order-modal"]').should('be.visible')
    })

    it('should open integration dialog when clicking supplier card', () => {
      cy.visit('/import')
      
      cy.get('[data-testid="supplier-card"]').first().click()
      cy.get('[data-testid="create-integration-modal"]').should('be.visible')
    })
  })

  describe('SEO Optimization Buttons', () => {
    it('should show loading and success for AI optimization', () => {
      cy.visit('/seo-ultra-pro-optimized')
      
      cy.get('[data-testid="ai-optimize-all-button"]').click()
      cy.get('[data-testid="ai-optimize-all-button"]').should('contain', 'Application en cours...')
      cy.get('[data-testid="ai-optimize-all-button"]').should('be.disabled')
      
      cy.wait(3000)
      cy.get('.toast').should('contain', 'Optimisations IA appliquées automatiquement')
    })

    it('should generate content when clicking generate button', () => {
      cy.visit('/seo-ultra-pro-optimized')
      cy.get('[data-value="content"]').click()
      
      cy.get('[data-testid="generate-content-button"]').first().click()
      cy.get('[data-testid="generate-content-button"]').first().should('contain', 'Génération...')
      
      cy.wait(2000)
      cy.get('.toast').should('contain', 'Contenu généré pour:')
    })
  })

  describe('Form Submission', () => {
    it('should prevent form submission for button without type', () => {
      cy.visit('/import-ultra-pro')
      
      // Test that buttons in forms have correct type attribute
      cy.get('form button[type!="submit"][type!="button"]').should('not.exist')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-busy attribute during loading', () => {
      cy.visit('/orders-ultra-pro')
      
      cy.get('[data-testid="sync-button"]').click()
      cy.get('[data-testid="sync-button"]').should('have.attr', 'aria-busy', 'true')
      
      cy.wait(1000)
      cy.get('[data-testid="sync-button"]').should('have.attr', 'aria-busy', 'false')
    })

    it('should be keyboard accessible', () => {
      cy.visit('/orders-ultra-pro')
      
      cy.get('[data-testid="sync-button"]').focus()
      cy.get('[data-testid="sync-button"]').type('{enter}')
      cy.get('[data-testid="sync-button"]').should('contain', 'Synchronisation...')
    })
  })

  describe('Error Handling', () => {
    it('should handle button errors gracefully', () => {
      cy.visit('/orders-ultra-pro')
      
      // Mock a failing API call
      cy.intercept('POST', '/api/sync', { statusCode: 500 }).as('failingSync')
      
      cy.get('[data-testid="sync-button"]').click()
      
      cy.wait(1000)
      cy.get('.toast').should('contain', 'Erreur')
    })
  })
})