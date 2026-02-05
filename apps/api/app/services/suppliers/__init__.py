# Suppliers service module
from .base import BaseSupplierService
from .bigbuy import BigBuyService
from .aliexpress import AliExpressService


def get_supplier_service(supplier_id: str) -> BaseSupplierService:
    """Factory to get appropriate supplier service"""
    from app.core.database import get_supabase
    
    supabase = get_supabase()
    
    # Fetch supplier config
    result = supabase.table("supplier_integrations")\
        .select("*")\
        .eq("id", supplier_id)\
        .single()\
        .execute()
    
    if not result.data:
        raise ValueError(f"Supplier not found: {supplier_id}")
    
    supplier = result.data
    supplier_type = supplier.get("supplier_type", "").lower()
    api_key = supplier.get("api_key")
    
    if supplier_type == "bigbuy":
        return BigBuyService(api_key=api_key, config=supplier.get("config"))
    elif supplier_type == "aliexpress":
        return AliExpressService(api_key=api_key, config=supplier.get("config"))
    else:
        raise ValueError(f"Unsupported supplier type: {supplier_type}")


__all__ = [
    "BaseSupplierService",
    "BigBuyService",
    "AliExpressService",
    "get_supplier_service"
]
