/// <reference types="cypress" />

describe('CSV Import/Export', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });

    cy.intercept('GET', '**/rest/v1/products*', {
      statusCode: 200,
      body: [
        { id: 'prod-1', title: 'Produit A', sku: 'SKU-001', price: 29.99, stock: 100 },
        { id: 'prod-2', title: 'Produit B', sku: 'SKU-002', price: 49.99, stock: 50 },
        { id: 'prod-3', title: 'Produit C', sku: 'SKU-003', price: 19.99, stock: 200 }
      ]
    }).as('getProducts');
  });

  describe('CSV Import', () => {
    it('should display import page with file upload zone', () => {
      cy.visit('/products/import');

      cy.contains('Importer des produits').should('be.visible');
      cy.get('[data-testid="file-upload-zone"]').should('be.visible');
    });

    it('should accept CSV file drop', () => {
      cy.visit('/products/import');

      const csvContent = 'title,sku,price,stock\nProduit D,SKU-004,39.99,75';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'products.csv', { type: 'text/csv' });

      cy.get('[data-testid="file-upload-zone"]').selectFile({
        contents: Cypress.Buffer.from(csvContent),
        fileName: 'products.csv',
        mimeType: 'text/csv'
      }, { action: 'drag-drop' });

      cy.contains('products.csv').should('be.visible');
    });

    it('should show preview after file selection', () => {
      cy.visit('/products/import');

      const csvContent = 'title,sku,price,stock\nProduit D,SKU-004,39.99,75\nProduit E,SKU-005,59.99,30';

      cy.get('[data-testid="file-upload-zone"]').selectFile({
        contents: Cypress.Buffer.from(csvContent),
        fileName: 'products.csv',
        mimeType: 'text/csv'
      });

      cy.contains('Aperçu').should('be.visible');
      cy.contains('Produit D').should('be.visible');
      cy.contains('2 produits').should('be.visible');
    });

    it('should validate CSV columns', () => {
      cy.visit('/products/import');

      const invalidCsv = 'name,cost\nTest,10'; // Missing required columns

      cy.get('[data-testid="file-upload-zone"]').selectFile({
        contents: Cypress.Buffer.from(invalidCsv),
        fileName: 'invalid.csv',
        mimeType: 'text/csv'
      });

      cy.contains('Colonnes manquantes').should('be.visible');
    });

    it('should import products successfully', () => {
      cy.intercept('POST', '**/rest/v1/products*', {
        statusCode: 201,
        body: [{ id: 'new-prod', title: 'Produit D' }]
      }).as('importProducts');

      cy.visit('/products/import');

      const csvContent = 'title,sku,price,stock\nProduit D,SKU-004,39.99,75';

      cy.get('[data-testid="file-upload-zone"]').selectFile({
        contents: Cypress.Buffer.from(csvContent),
        fileName: 'products.csv',
        mimeType: 'text/csv'
      });

      cy.contains('Importer').click();
      cy.wait('@importProducts');
      cy.contains('Import réussi').should('be.visible');
    });

    it('should handle import errors gracefully', () => {
      cy.intercept('POST', '**/rest/v1/products*', {
        statusCode: 400,
        body: { error: 'Duplicate SKU' }
      }).as('importError');

      cy.visit('/products/import');

      const csvContent = 'title,sku,price,stock\nProduit D,SKU-001,39.99,75';

      cy.get('[data-testid="file-upload-zone"]').selectFile({
        contents: Cypress.Buffer.from(csvContent),
        fileName: 'products.csv',
        mimeType: 'text/csv'
      });

      cy.contains('Importer').click();
      cy.wait('@importError');
      cy.contains('Erreur').should('be.visible');
    });

    it('should support column mapping', () => {
      cy.visit('/products/import');

      const csvContent = 'nom,reference,prix,quantite\nProduit D,SKU-004,39.99,75';

      cy.get('[data-testid="file-upload-zone"]').selectFile({
        contents: Cypress.Buffer.from(csvContent),
        fileName: 'products.csv',
        mimeType: 'text/csv'
      });

      cy.contains('Mapper les colonnes').should('be.visible');
      
      // Map columns
      cy.get('[data-testid="map-nom"]').select('title');
      cy.get('[data-testid="map-reference"]').select('sku');
      cy.get('[data-testid="map-prix"]').select('price');
      cy.get('[data-testid="map-quantite"]').select('stock');
    });
  });

  describe('CSV Export', () => {
    it('should open export dialog', () => {
      cy.visit('/products');
      cy.wait('@getProducts');

      cy.contains('Exporter').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Exporter les produits').should('be.visible');
    });

    it('should select export format', () => {
      cy.visit('/products');
      cy.wait('@getProducts');

      cy.contains('Exporter').click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.contains('CSV').should('be.visible');
        cy.contains('Excel').should('be.visible');
        cy.contains('JSON').should('be.visible');
      });
    });

    it('should select columns to export', () => {
      cy.visit('/products');
      cy.wait('@getProducts');

      cy.contains('Exporter').click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.get('[data-testid="column-title"]').should('be.checked');
        cy.get('[data-testid="column-sku"]').should('be.checked');
        cy.get('[data-testid="column-description"]').uncheck();
      });
    });

    it('should export selected products only', () => {
      cy.visit('/products');
      cy.wait('@getProducts');

      // Select some products
      cy.get('[data-testid="select-product"]').first().click();
      cy.get('[data-testid="select-product"]').eq(1).click();

      cy.contains('Exporter (2)').click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.contains('2 produits sélectionnés').should('be.visible');
      });
    });

    it('should trigger download on export', () => {
      cy.visit('/products');
      cy.wait('@getProducts');

      cy.contains('Exporter').click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Télécharger').click();
      });

      // Verify download was triggered (cy.readFile would work for actual file)
      cy.contains('Export terminé').should('be.visible');
    });

    it('should export with filters applied', () => {
      cy.visit('/products');
      cy.wait('@getProducts');

      // Apply a filter
      cy.get('input[placeholder*="Rechercher"]').type('Produit A');
      
      cy.contains('Exporter').click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.contains('1 produit').should('be.visible');
      });
    });
  });

  describe('Import History', () => {
    it('should display import history', () => {
      cy.intercept('GET', '**/rest/v1/import_jobs*', {
        statusCode: 200,
        body: [
          {
            id: 'job-1',
            file_name: 'products.csv',
            status: 'completed',
            total_rows: 100,
            imported_rows: 98,
            failed_rows: 2,
            created_at: new Date().toISOString()
          }
        ]
      }).as('getImportHistory');

      cy.visit('/products/import/history');
      cy.wait('@getImportHistory');

      cy.contains('Historique des imports').should('be.visible');
      cy.contains('products.csv').should('be.visible');
      cy.contains('98/100').should('be.visible');
    });

    it('should view import details with errors', () => {
      cy.intercept('GET', '**/rest/v1/import_jobs*', {
        statusCode: 200,
        body: [{
          id: 'job-1',
          file_name: 'products.csv',
          status: 'completed_with_errors',
          total_rows: 100,
          imported_rows: 90,
          failed_rows: 10,
          errors: [
            { row: 5, error: 'Invalid price format' },
            { row: 12, error: 'Duplicate SKU' }
          ],
          created_at: new Date().toISOString()
        }]
      }).as('getImportHistory');

      cy.visit('/products/import/history');
      cy.wait('@getImportHistory');

      cy.contains('products.csv').click();
      cy.contains('10 erreurs').should('be.visible');
      cy.contains('Invalid price format').should('be.visible');
    });
  });
});
