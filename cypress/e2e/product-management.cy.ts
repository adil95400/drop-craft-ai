describe('Product Management', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token',
        user: { id: 'user-123' }
      }))
    })
  })

  it('displays product list', () => {
    cy.intercept('GET', '**/rest/v1/catalog_products*', {
      statusCode: 200,
      body: [
        {
          id: '1',
          name: 'Product 1',
          price: 99.99,
          stock_quantity: 10
        },
        {
          id: '2',
          name: 'Product 2',
          price: 149.99,
          stock_quantity: 5
        }
      ]
    }).as('getProducts')

    cy.visit('/import/manage/list')
    cy.wait('@getProducts')
    
    cy.contains('Product 1').should('be.visible')
    cy.contains('Product 2').should('be.visible')
  })

  it('filters products by search', () => {
    cy.visit('/import/manage/list')
    
    cy.get('input[placeholder*="Rechercher"]').type('Product 1')
    
    cy.contains('Product 1').should('be.visible')
    cy.contains('Product 2').should('not.exist')
  })

  it('edits product details', () => {
    cy.intercept('PATCH', '**/rest/v1/catalog_products*', {
      statusCode: 200,
      body: { success: true }
    }).as('updateProduct')

    cy.visit('/import/manage/list')
    
    // Click edit button
    cy.get('[data-testid="edit-product-1"]').click()
    
    // Modify product
    cy.get('input[name="name"]').clear().type('Updated Product Name')
    cy.get('input[name="price"]').clear().type('199.99')
    
    // Save
    cy.get('button[type="submit"]').click()
    
    cy.wait('@updateProduct')
    cy.contains(/Produit mis à jour/i).should('be.visible')
  })

  it('deletes product', () => {
    cy.intercept('DELETE', '**/rest/v1/catalog_products*', {
      statusCode: 200
    }).as('deleteProduct')

    cy.visit('/import/manage/list')
    
    // Click delete button
    cy.get('[data-testid="delete-product-1"]').click()
    
    // Confirm deletion
    cy.contains(/Confirmer/i).click()
    
    cy.wait('@deleteProduct')
    cy.contains(/Produit supprimé/i).should('be.visible')
  })

  it('bulk imports products', () => {
    cy.visit('/import/quick')
    
    cy.contains('Fichier CSV').click()
    
    // Upload CSV with multiple products
    cy.get('input[type="file"]').selectFile('cypress/fixtures/bulk-products.csv', {
      force: true
    })
    
    cy.get('button').contains(/Importer/i).click()
    
    // Verify import summary
    cy.contains(/produits importés/i).should('be.visible')
  })

  it('syncs with Shopify', () => {
    cy.intercept('POST', '**/functions/v1/shopify-sync', {
      statusCode: 200,
      body: {
        success: true,
        imported: 15,
        message: 'Synchronisation réussie'
      }
    }).as('shopifySync')

    cy.visit('/import/manage/list')
    
    // Click sync button
    cy.get('button').contains(/Sync Shopify/i).click()
    
    cy.wait('@shopifySync')
    cy.contains(/15 produits synchronisés/i).should('be.visible')
  })
})
