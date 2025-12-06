-- Create a view that joins shopify_products with store_integrations to get user_id
CREATE OR REPLACE VIEW shopify_products_with_user AS
SELECT 
  sp.*,
  si.user_id
FROM shopify_products sp
LEFT JOIN store_integrations si ON sp.store_integration_id = si.id;