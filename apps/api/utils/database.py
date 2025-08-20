"""
Database utilities and Supabase client
"""

from supabase import create_client, Client
import os
from typing import Optional
import structlog

logger = structlog.get_logger()

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Get or create Supabase client"""
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized")
    
    return _supabase_client

class DatabaseManager:
    """Database operations manager"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def insert_products_batch(self, products: list, user_id: str) -> dict:
        """Insert multiple products with user association"""
        try:
            # Add user_id to all products
            for product in products:
                product['user_id'] = user_id
            
            result = self.supabase.table('products').insert(products).execute()
            
            logger.info(f"Inserted {len(products)} products for user {user_id}")
            return {"success": True, "count": len(products), "data": result.data}
            
        except Exception as e:
            logger.error(f"Batch insert error: {str(e)}")
            raise
    
    async def get_user_products(self, user_id: str, filters: dict = None) -> list:
        """Get products for a user with optional filters"""
        try:
            query = self.supabase.table('products').select("*").eq('user_id', user_id)
            
            if filters:
                if filters.get('status'):
                    query = query.eq('status', filters['status'])
                if filters.get('category_id'):
                    query = query.eq('category_id', filters['category_id'])
                if filters.get('supplier_id'):
                    query = query.eq('supplier_id', filters['supplier_id'])
            
            result = query.execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Get products error: {str(e)}")
            raise
    
    async def update_product(self, product_id: str, user_id: str, update_data: dict) -> dict:
        """Update a product with ownership check"""
        try:
            result = self.supabase.table('products').update(update_data).eq('id', product_id).eq('user_id', user_id).execute()
            
            if not result.data:
                raise ValueError("Product not found or access denied")
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Update product error: {str(e)}")
            raise
    
    async def create_audit_log(self, user_id: str, action: str, entity: str, entity_id: str = None, data: dict = None):
        """Create audit log entry"""
        try:
            audit_data = {
                'user_id': user_id,
                'actor': user_id,
                'action': action,
                'entity': entity,
                'entity_id': entity_id,
                'data': data or {}
            }
            
            self.supabase.table('audit_logs').insert(audit_data).execute()
            
        except Exception as e:
            logger.warning(f"Audit log creation failed: {str(e)}")
            # Don't raise - audit logging shouldn't break main operations