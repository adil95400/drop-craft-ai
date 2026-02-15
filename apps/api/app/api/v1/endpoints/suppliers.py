"""
Supplier integration endpoints
BigBuy, AliExpress, Temu, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from app.core.security import get_current_user_id
from app.services.suppliers.bigbuy import BigBuyService
from app.services.suppliers.aliexpress import AliExpressService
from app.queue.tasks import sync_supplier_products

logger = logging.getLogger(__name__)
router = APIRouter()


class SupplierConnectRequest(BaseModel):
    supplier_type: str  # bigbuy, aliexpress, temu
    api_key: str
    additional_config: Optional[Dict[str, Any]] = None


class SupplierSyncRequest(BaseModel):
    supplier_id: str
    sync_type: str = "products"  # products, stock, orders
    limit: Optional[int] = 1000
    category_filter: Optional[str] = None


class SupplierResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


@router.post("/connect", response_model=SupplierResponse)
async def connect_supplier(
    request: SupplierConnectRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Connect a new supplier integration"""
    try:
        # Validate API key based on supplier type
        if request.supplier_type == "bigbuy":
            service = BigBuyService(request.api_key)
            valid = await service.validate_credentials()
        elif request.supplier_type == "aliexpress":
            service = AliExpressService(request.api_key)
            valid = await service.validate_credentials()
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported supplier type: {request.supplier_type}"
            )
        
        if not valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid API credentials"
            )
        
        # Store integration in database
        # TODO: Save to suppliers table
        
        return SupplierResponse(
            success=True,
            message=f"Successfully connected to {request.supplier_type}",
            data={"supplier_type": request.supplier_type}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Supplier connection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync", response_model=SupplierResponse)
async def trigger_supplier_sync(
    request: SupplierSyncRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id)
):
    """Trigger async supplier synchronization"""
    try:
        # Create a background job for the sync
        result = sync_supplier_products.delay(
            user_id=user_id,
            supplier_id=request.supplier_id,
            sync_type=request.sync_type,
            limit=request.limit,
            category_filter=request.category_filter
        )
        
        return SupplierResponse(
            success=True,
            message="Sync job queued successfully",
            data={"job_id": str(result.id)}
        )
        
    except Exception as e:
        logger.error(f"Sync trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_suppliers(
    user_id: str = Depends(get_current_user_id)
):
    """List all connected suppliers for the user"""
    # TODO: Fetch from database
    return {
        "success": True,
        "suppliers": []
    }


@router.get("/{supplier_id}/status")
async def get_supplier_status(
    supplier_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get supplier connection status and last sync info"""
    # TODO: Fetch from database
    return {
        "success": True,
        "status": "connected",
        "last_sync": None,
        "products_count": 0
    }
