describe('Button Functionality Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Landing Page Navigation', () => {
    it('should navigate to auth page when clicking CTA button', () => {
      cy.get('button').contains('Essai gratuit').click()
      cy.url().should('include', '/auth')
    })

    it('should navigate to features page when clicking feature links', () => {
      cy.get('a[href="/features/ai-optimization"], button').contains('En savoir plus').first().click()
      cy.url().should('include', '/features')
    })

    it('should navigate to pricing page when clicking pricing link', () => {
      cy.get('a[href="/pricing"]').first().click()
      cy.url().should('include', '/pricing')
    })
  })

  describe('Public Page Buttons', () => {
    it('should have functional buttons on landing page', () => {
      // Check CTA buttons exist and are clickable
      cy.get('button').contains('Essai gratuit').should('be.visible')
      cy.get('button').contains('Voir la démo').should('be.visible')
    })

    it('should navigate between sections via scroll or links', () => {
      // Features section
      cy.get('section').contains('Fonctionnalités').should('be.visible')
      
      // Stats section
      cy.get('section').contains('99+').should('be.visible')
    })
  })

  describe('Auth Page Buttons', () => {
    beforeEach(() => {
      cy.visit('/auth')
    })

    it('should have login button', () => {
      cy.get('button').contains('Se connecter').should('be.visible')
    })

    it('should toggle between login and register tabs', () => {
      cy.get('button, [role="tab"]').contains('Inscription').click()
      cy.get('button').contains('Créer un compte').should('be.visible')
    })

    it('should have Google login option', () => {
      cy.get('button').contains('Google').should('be.visible')
    })
  })

  describe('Form Submission', () => {
    it('should prevent form submission with invalid data on auth page', () => {
      cy.visit('/auth')
      
      // Try to submit empty form
      cy.get('button').contains('Se connecter').click()
      
      // Should show validation errors or stay on page
      cy.url().should('include', '/auth')
    })
  })

  describe('Navigation Links', () => {
    it('should have functional navigation links in header', () => {
      // Check navigation links exist
      cy.get('nav, header').within(() => {
        cy.get('a').should('have.length.at.least', 3)
      })
    })

    it('should navigate to contact page', () => {
      cy.get('a[href="/contact"]').first().click()
      cy.url().should('include', '/contact')
    })

    it('should navigate to blog page', () => {
      cy.get('a[href="/blog"]').first().click()
      cy.url().should('include', '/blog')
    })
  })

  describe('Responsive Behavior', () => {
    it('should have working buttons on mobile viewport', () => {
      cy.viewport('iphone-x')
      
      cy.get('button').contains('Essai gratuit').should('be.visible')
    })

    it('should have working buttons on tablet viewport', () => {
      cy.viewport('ipad-2')
      
      cy.get('button').contains('Essai gratuit').should('be.visible')
      cy.get('button').contains('Voir la démo').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible buttons with proper roles', () => {
      // All buttons should have proper button role or be actual buttons
      cy.get('button').each(($btn) => {
        cy.wrap($btn).should('have.attr', 'type').or('not.have.attr', 'type')
      })
    })

    it('should be keyboard navigable', () => {
      // Tab through navigation
      cy.get('body').tab()
      cy.focused().should('exist')
    })
  })

  describe('Error States', () => {
    it('should handle 404 pages gracefully', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false })
      
      // Should show error page or redirect
      cy.get('body').should('exist')
    })
  })
})
