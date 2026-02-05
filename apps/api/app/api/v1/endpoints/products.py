"""
Product management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()


class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sku: Optional[str] = None
    cost_price: float = 0
    sale_price: float
    currency: str = "EUR"
    stock: int = 0
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    images: List[str] = []
    attributes: Dict[str, Any] = {}


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    stock: Optional[int] = None
    status: Optional[str] = None
    images: Optional[List[str]] = None
    attributes: Optional[Dict[str, Any]] = None


class BulkPriceUpdate(BaseModel):
    product_ids: List[str]
    adjustment_type: str  # percentage, fixed
    adjustment_value: float
    apply_to: str = "sale_price"  # sale_price, cost_price


@router.get("/")
async def list_products(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    search: Optional[str] = None
):
    """List products with filtering and pagination"""
    try:
        supabase = get_supabase()
        
        query = supabase.table("products").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("status", status)
        if category_id:
            query = query.eq("category_id", category_id)
        if supplier_id:
            query = query.eq("supplier_id", supplier_id)
        if search:
            query = query.ilike("title", f"%{search}%")
        
        # Pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        return {
            "success": True,
            "products": result.data,
            "page": page,
            "limit": limit,
            "total": len(result.data)  # TODO: Get actual count
        }
        
    except Exception as e:
        logger.error(f"Failed to list products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_product(
    product: ProductCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new product"""
    try:
        supabase = get_supabase()
        
        product_data = product.model_dump()
        product_data["user_id"] = user_id
        product_data["created_at"] = datetime.utcnow().isoformat()
        product_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("products").insert(product_data).execute()
        
        return {
            "success": True,
            "product": result.data[0] if result.data else None
        }
        
    except Exception as e:
        logger.error(f"Failed to create product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{product_id}")
async def update_product(
    product_id: str,
    updates: ProductUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a product"""
    try:
        supabase = get_supabase()
        
        update_data = updates.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("products")\
            .update(update_data)\
            .eq("id", product_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {
            "success": True,
            "product": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-price-update")
async def bulk_update_prices(
    request: BulkPriceUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Bulk update product prices"""
    try:
        supabase = get_supabase()
        updated_count = 0
        
        for product_id in request.product_ids:
            # Fetch current price
            result = supabase.table("products")\
                .select(request.apply_to)\
                .eq("id", product_id)\
                .eq("user_id", user_id)\
                .single()\
                .execute()
            
            if result.data:
                current_price = result.data.get(request.apply_to, 0)
                
                if request.adjustment_type == "percentage":
                    new_price = current_price * (1 + request.adjustment_value / 100)
                else:
                    new_price = current_price + request.adjustment_value
                
                supabase.table("products")\
                    .update({
                        request.apply_to: round(new_price, 2),
                        "updated_at": datetime.utcnow().isoformat()
                    })\
                    .eq("id", product_id)\
                    .execute()
                
                updated_count += 1
        
        return {
            "success": True,
            "updated_count": updated_count
        }
        
    except Exception as e:
        logger.error(f"Bulk price update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a product"""
    try:
        supabase = get_supabase()
        
        result = supabase.table("products")\
            .delete()\
            .eq("id", product_id)\
            .eq("user_id", user_id)\
            .execute()
        
        return {
            "success": True,
            "message": "Product deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to delete product: {e}")
        raise HTTPException(status_code=500, detail=str(e))
