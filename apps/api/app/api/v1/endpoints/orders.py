"""
Order management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase
from app.queue.tasks import process_order_fulfillment

logger = logging.getLogger(__name__)
router = APIRouter()


class OrderFulfillRequest(BaseModel):
    order_id: str
    supplier_id: Optional[str] = None
    auto_select_supplier: bool = True


class BulkFulfillRequest(BaseModel):
    order_ids: List[str]
    supplier_preference: Optional[str] = None


@router.get("/")
async def list_orders(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    platform: Optional[str] = None
):
    """List orders with filtering"""
    try:
        supabase = get_supabase()
        
        query = supabase.table("orders").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("status", status)
        if platform:
            query = query.eq("platform", platform)
        
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)\
            .order("created_at", desc=True)
        
        result = query.execute()
        
        return {
            "success": True,
            "orders": result.data,
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Failed to list orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get order details"""
    try:
        supabase = get_supabase()
        
        result = supabase.table("orders")\
            .select("*, order_items(*)")\
            .eq("id", order_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {
            "success": True,
            "order": result.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get order: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fulfill")
async def fulfill_order(
    request: OrderFulfillRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Trigger order fulfillment (async job)"""
    try:
        result = process_order_fulfillment.delay(
            user_id=user_id,
            order_id=request.order_id,
            supplier_id=request.supplier_id,
            auto_select=request.auto_select_supplier
        )
        
        return {
            "success": True,
            "message": "Fulfillment job queued",
            "job_id": str(result.id)
        }
        
    except Exception as e:
        logger.error(f"Fulfillment trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-fulfill")
async def bulk_fulfill_orders(
    request: BulkFulfillRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Bulk order fulfillment"""
    try:
        job_ids = []
        
        for order_id in request.order_ids:
            result = process_order_fulfillment.delay(
                user_id=user_id,
                order_id=order_id,
                supplier_id=request.supplier_preference,
                auto_select=True
            )
            job_ids.append(str(result.id))
        
        return {
            "success": True,
            "message": f"Queued {len(job_ids)} fulfillment jobs",
            "job_ids": job_ids
        }
        
    except Exception as e:
        logger.error(f"Bulk fulfillment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    user_id: str = Depends(get_current_user_id)
):
    """Update order status"""
    try:
        supabase = get_supabase()
        
        valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {valid_statuses}"
            )
        
        result = supabase.table("orders")\
            .update({"status": status})\
            .eq("id", order_id)\
            .eq("user_id", user_id)\
            .execute()
        
        return {
            "success": True,
            "message": f"Order status updated to {status}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
