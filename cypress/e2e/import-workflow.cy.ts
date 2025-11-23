describe('Product Import Workflow', () => {
  beforeEach(() => {
    cy.visit('/import/quick')
  })

  it('completes full import workflow from URL', () => {
    // Mock Supabase response
    cy.intercept('POST', '**/functions/v1/**', {
      statusCode: 200,
      body: {
        success: true,
        imported: 1,
        product: {
          id: 'test-123',
          name: 'Test Product',
          price: 99.99
        }
      }
    }).as('importProduct')

    // Fill URL
    cy.get('input[placeholder*="URL"]').type('https://example.com/product/test')
    
    // Submit
    cy.get('button').contains(/Importer/i).click()
    
    // Wait for API call
    cy.wait('@importProduct')
    
    // Verify success message
    cy.contains(/Import réussi/i).should('be.visible')
  })

  it('handles CSV file upload', () => {
    // Click file upload tab
    cy.contains('Fichier CSV').click()
    
    // Upload file
    cy.get('input[type="file"]').selectFile('cypress/fixtures/products.csv', {
      force: true
    })
    
    // Verify file is selected
    cy.contains(/products.csv/i).should('be.visible')
    
    // Submit
    cy.get('button').contains(/Importer/i).click()
  })

  it('validates required fields', () => {
    // Try to submit empty form
    cy.get('button').contains(/Importer/i).should('be.disabled')
    
    // Fill URL
    cy.get('input[placeholder*="URL"]').type('invalid-url')
    
    // Button should still be disabled
    cy.get('button').contains(/Importer/i).should('be.disabled')
  })

  it('displays import history', () => {
    // Navigate to import history
    cy.visit('/import/manage')
    cy.contains('Historique').click()
    
    // Check for history table
    cy.get('table').should('exist')
  })
})

describe('Shopify Store Import', () => {
  beforeEach(() => {
    cy.visit('/products/import/shopify-store')
  })

  it('imports products from Shopify store', () => {
    // Mock API response
    cy.intercept('POST', '**/functions/v1/shopify-store-import', {
      statusCode: 200,
      body: {
        success: true,
        imported: 25,
        variants: 50,
        errors: []
      }
    }).as('shopifyImport')

    // Fill store URL
    cy.get('input[placeholder*="myshopify.com"]').type('test-store.myshopify.com')
    
    // Enable variants import
    cy.contains('Importer les variantes').parent().find('button').click()
    
    // Submit
    cy.get('button').contains(/Lancer l'import/i).click()
    
    // Wait for import
    cy.wait('@shopifyImport')
    
    // Verify success
    cy.contains(/25 produits importés/i).should('be.visible')
    cy.contains(/50 variantes/i).should('be.visible')
  })

  it('validates Shopify URL format', () => {
    // Enter invalid URL
    cy.get('input[placeholder*="myshopify.com"]').type('not-a-shopify-url.com')
    
    // Try to submit
    cy.get('button').contains(/Lancer l'import/i).click()
    
    // Check for error
    cy.contains(/URL Shopify invalide/i).should('be.visible')
  })

  it('handles import errors gracefully', () => {
    // Mock error response
    cy.intercept('POST', '**/functions/v1/shopify-store-import', {
      statusCode: 500,
      body: {
        error: 'Store not found'
      }
    }).as('shopifyImportError')

    cy.get('input[placeholder*="myshopify.com"]').type('invalid-store.myshopify.com')
    cy.get('button').contains(/Lancer l'import/i).click()
    
    cy.wait('@shopifyImportError')
    
    cy.contains(/Erreur/i).should('be.visible')
  })
})
