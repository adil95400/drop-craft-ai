describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and local storage
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('redirects to login when not authenticated', () => {
    cy.visit('/products')
    cy.url().should('include', '/auth')
  })

  it('completes sign up flow', () => {
    cy.visit('/auth/signup')
    
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('SecurePassword123!')
    cy.get('button[type="submit"]').click()
    
    cy.contains(/Vérifiez votre email/i).should('be.visible')
  })

  it('completes login flow', () => {
    cy.visit('/auth/login')
    
    // Mock successful login
    cy.intercept('POST', '**/auth/v1/token*', {
      statusCode: 200,
      body: {
        access_token: 'fake-token',
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      }
    }).as('login')
    
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    
    cy.wait('@login')
    cy.url().should('not.include', '/auth')
  })

  it('handles login errors', () => {
    cy.visit('/auth/login')
    
    cy.intercept('POST', '**/auth/v1/token*', {
      statusCode: 400,
      body: {
        error: 'Invalid credentials'
      }
    }).as('loginError')
    
    cy.get('input[type="email"]').type('wrong@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    cy.wait('@loginError')
    cy.contains(/Identifiants invalides/i).should('be.visible')
  })

  it('completes logout flow', () => {
    // Mock authenticated state
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token'
      }))
    })
    
    cy.visit('/')
    
    // Open user menu and logout
    cy.get('[data-testid="user-menu"]').click()
    cy.contains(/Déconnexion/i).click()
    
    cy.url().should('include', '/auth')
  })
})
