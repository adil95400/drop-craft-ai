# ShopOpti Production Launch Checklist

## Pre-Launch Verification

### Database
- [ ] All tables created with proper schemas
- [ ] RLS policies enabled on all user-facing tables
- [ ] Indexes created for frequently queried columns
- [ ] Foreign key constraints properly configured
- [ ] Default values and constraints validated

### Authentication
- [ ] Email/password authentication working
- [ ] Password reset flow functional
- [ ] Session management configured
- [ ] Protected routes enforced
- [ ] Admin role verification working

### Edge Functions
- [ ] All edge functions deployed
- [ ] CORS headers configured correctly
- [ ] Error handling implemented
- [ ] Rate limiting considered
- [ ] Secrets configured in Supabase

### Integrations
- [ ] Shopify connection tested
- [ ] WooCommerce connection tested
- [ ] Supplier connectors functional
- [ ] Marketplace publishing APIs working
- [ ] Webhook endpoints configured

### UI/UX
- [ ] All buttons functional (no placeholders)
- [ ] All routes resolve to pages
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Mobile responsiveness verified
- [ ] Toast notifications working

### Data Operations
- [ ] Product CRUD operations working
- [ ] Customer CRUD operations working
- [ ] Order CRUD operations working
- [ ] Bulk operations functional
- [ ] Import/export working

### Performance
- [ ] Database queries optimized
- [ ] Images lazy loaded
- [ ] Components properly memoized
- [ ] Bundle size acceptable
- [ ] API response times < 1s

### Security
- [ ] No exposed API keys in client code
- [ ] RLS policies tested
- [ ] Input validation implemented
- [ ] XSS prevention in place
- [ ] CSRF protection enabled

## Launch Day

### Final Checks
- [ ] Run Production Readiness Checker
- [ ] Verify all environment variables
- [ ] Test critical user flows end-to-end
- [ ] Verify billing/subscription system
- [ ] Check email delivery

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Analytics enabled
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured

### Documentation
- [ ] User guides completed
- [ ] API documentation available
- [ ] FAQ section populated
- [ ] Support contact information visible

## Post-Launch

### Day 1
- [ ] Monitor error rates
- [ ] Check user registration flow
- [ ] Verify payment processing
- [ ] Review performance metrics

### Week 1
- [ ] Analyze user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Update documentation as needed

---

## Quick Commands

### Run Production Checks
Navigate to `/production-readiness` in the app

### Check Database
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Verify Edge Functions
```bash
# In Supabase Dashboard > Functions > Logs
```

### Test API Endpoints
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/[function-name]
```
