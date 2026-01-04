// Cypress E2E Support File
import './commands'

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent the error from failing the test
  // This is useful for third-party scripts that might throw errors
  if (err.message.includes('ResizeObserver')) {
    return false
  }
  if (err.message.includes('Non-Error')) {
    return false
  }
  return true
})

// Add custom assertions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with mock credentials
       */
      mockLogin(): Chainable<void>
      
      /**
       * Wait for loading to complete
       */
      waitForLoading(): Chainable<void>
      
      /**
       * Check toast notification
       */
      checkToast(message: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('mockLogin', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    }))
  })
})

Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]').should('not.exist')
  cy.get('[data-loading="true"]').should('not.exist')
})

Cypress.Commands.add('checkToast', (message: string) => {
  cy.get('[data-sonner-toast]', { timeout: 5000 })
    .should('be.visible')
    .and('contain', message)
})

// Before each test, set viewport
beforeEach(() => {
  cy.viewport(1280, 720)
})
