// Custom commands for Cypress E2E testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to test async button behavior
       */
      testAsyncButton(selector: string, loadingText: string, waitTime: number): Chainable<Element>
      
      /**
       * Custom command to test modal opening
       */
      testModalOpen(triggerSelector: string, modalSelector: string): Chainable<Element>
      
      /**
       * Select file for upload
       */
      selectFile(file: { contents: Cypress.Buffer; fileName: string; mimeType: string }, options?: { action?: string }): Chainable<Element>
      
      /**
       * Assert table has specific number of rows
       */
      tableHasRows(count: number): Chainable<Element>
      
      /**
       * Fill form field by label
       */
      fillField(label: string, value: string): Chainable<Element>
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

Cypress.Commands.add('tableHasRows', { prevSubject: 'element' }, (subject, count: number) => {
  cy.wrap(subject).find('tbody tr').should('have.length', count)
})

Cypress.Commands.add('fillField', (label: string, value: string) => {
  cy.contains('label', label).parent().find('input, textarea, select').clear().type(value)
})

export {}