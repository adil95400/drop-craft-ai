// Custom commands for button testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to test async button behavior
       * @example cy.testAsyncButton('[data-testid="sync-button"]', 'Synchronisation...', 1000)
       */
      testAsyncButton(selector: string, loadingText: string, waitTime: number): Chainable<Element>
      
      /**
       * Custom command to test modal opening
       * @example cy.testModalOpen('[data-testid="modal-trigger"]', '[data-testid="modal"]')
       */
      testModalOpen(triggerSelector: string, modalSelector: string): Chainable<Element>
    }
  }
}

Cypress.Commands.add('testAsyncButton', (selector: string, loadingText: string, waitTime: number) => {
  cy.get(selector).click()
  cy.get(selector).should('contain', loadingText)
  cy.get(selector).should('be.disabled')
  cy.get(selector).should('have.attr', 'aria-busy', 'true')
  
  cy.wait(waitTime)
  
  cy.get(selector).should('not.be.disabled')
  cy.get(selector).should('have.attr', 'aria-busy', 'false')
})

Cypress.Commands.add('testModalOpen', (triggerSelector: string, modalSelector: string) => {
  cy.get(triggerSelector).click()
  cy.get(modalSelector).should('be.visible')
  cy.get(modalSelector).should('have.attr', 'role', 'dialog')
})

export {}