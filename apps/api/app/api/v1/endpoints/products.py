"""
Product management endpoints — aligned with unified DB schema
Server-side filtering, sorting, pagination, bulk actions, export
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import csv
import io

from app.core.security import get_current_user_id
from app.core.database import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()


# === SCHEMAS ===

class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sku: Optional[str] = None
    cost_price: float = 0
    price: float = 0
    currency: str = "EUR"
    stock_quantity: int = 0
    category: Optional[str] = None
    status: str = "draft"
    image_url: Optional[str] = None
    tags: List[str] = []
    product_type: Optional[str] = None
    vendor: Optional[str] = None
    weight: Optional[float] = None
    weight_unit: str = "kg"


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    cost_price: Optional[float] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    stock_quantity: Optional[int] = None
    category: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    product_type: Optional[str] = None
    vendor: Optional[str] = None
    weight: Optional[float] = None
    weight_unit: Optional[str] = None


class BulkUpdateRequest(BaseModel):
    product_ids: List[str]
    updates: Dict[str, Any]


class BulkDeleteRequest(BaseModel):
    product_ids: List[str]


class BulkStatusRequest(BaseModel):
    product_ids: List[str]
    status: str


class BulkTagsRequest(BaseModel):
    product_ids: List[str]
    tags: List[str]
    action: str = "add"  # add | remove | replace


# === ENDPOINTS ===

@router.get("/")
async def list_products(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    vendor: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    low_stock: Optional[int] = None,
    tags: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|title|price|stock_quantity|updated_at|sku)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
):
    """List products with server-side filtering, sorting, pagination"""
    try:
        supabase = get_supabase()

        # Count query
        count_query = supabase.table("products").select("id", count="exact").eq("user_id", user_id)
        # Data query
        data_query = supabase.table("products").select("*").eq("user_id", user_id)

        # Apply filters to both
        for q_ref in [count_query, data_query]:
            if status:
                q_ref = q_ref.eq("status", status)
            if category:
                q_ref = q_ref.eq("category", category)
            if vendor:
                q_ref = q_ref.eq("vendor", vendor)
            if search:
                q_ref = q_ref.or_(f"title.ilike.%{search}%,sku.ilike.%{search}%,description.ilike.%{search}%")
            if min_price is not None:
                q_ref = q_ref.gte("price", min_price)
            if max_price is not None:
                q_ref = q_ref.lte("price", max_price)
            if low_stock is not None:
                q_ref = q_ref.lte("stock_quantity", low_stock)
            if tags:
                q_ref = q_ref.contains("tags", [tags])

        # Unfortunately supabase-py builder is not mutable via reassign in loop
        # Rebuild properly
        count_q = supabase.table("products").select("id", count="exact").eq("user_id", user_id)
        data_q = supabase.table("products").select("*").eq("user_id", user_id)

        if status:
            count_q = count_q.eq("status", status)
            data_q = data_q.eq("status", status)
        if category:
            count_q = count_q.eq("category", category)
            data_q = data_q.eq("category", category)
        if vendor:
            count_q = count_q.eq("vendor", vendor)
            data_q = data_q.eq("vendor", vendor)
        if search:
            search_filter = f"title.ilike.%{search}%,sku.ilike.%{search}%,description.ilike.%{search}%"
            count_q = count_q.or_(search_filter)
            data_q = data_q.or_(search_filter)
        if min_price is not None:
            count_q = count_q.gte("price", min_price)
            data_q = data_q.gte("price", min_price)
        if max_price is not None:
            count_q = count_q.lte("price", max_price)
            data_q = data_q.lte("price", max_price)
        if low_stock is not None:
            count_q = count_q.lte("stock_quantity", low_stock)
            data_q = data_q.lte("stock_quantity", low_stock)
        if tags:
            count_q = count_q.contains("tags", [tags])
            data_q = data_q.contains("tags", [tags])

        # Sort & paginate
        ascending = sort_order == "asc"
        data_q = data_q.order(sort_by, desc=not ascending)
        offset = (page - 1) * limit
        data_q = data_q.range(offset, offset + limit - 1)

        count_result = count_q.execute()
        data_result = data_q.execute()

        total = count_result.count if count_result.count is not None else len(data_result.data)

        return {
            "success": True,
            "products": data_result.data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit
            }
        }

    except Exception as e:
        logger.error(f"Failed to list products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_product_stats(
    user_id: str = Depends(get_current_user_id)
):
    """Get product statistics for the catalogue"""
    try:
        supabase = get_supabase()

        result = supabase.table("products").select(
            "id, status, price, cost_price, stock_quantity, category"
        ).eq("user_id", user_id).execute()

        products = result.data or []
        total = len(products)
        active = sum(1 for p in products if p.get("status") == "active")
        draft = sum(1 for p in products if p.get("status") == "draft")
        paused = sum(1 for p in products if p.get("status") == "paused")
        error = sum(1 for p in products if p.get("status") == "error")
        low_stock = sum(1 for p in products if (p.get("stock_quantity") or 0) <= 5 and (p.get("stock_quantity") or 0) >= 0)
        out_of_stock = sum(1 for p in products if (p.get("stock_quantity") or 0) == 0)
        total_value = sum((p.get("price") or 0) * (p.get("stock_quantity") or 0) for p in products)
        avg_margin = 0
        margin_products = [p for p in products if p.get("cost_price") and p.get("price") and p["price"] > 0]
        if margin_products:
            avg_margin = sum(
                ((p["price"] - p["cost_price"]) / p["price"]) * 100
                for p in margin_products
            ) / len(margin_products)

        # Categories breakdown
        categories = {}
        for p in products:
            cat = p.get("category") or "Non catégorisé"
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "success": True,
            "stats": {
                "total": total,
                "active": active,
                "draft": draft,
                "paused": paused,
                "error": error,
                "low_stock": low_stock,
                "out_of_stock": out_of_stock,
                "total_value": round(total_value, 2),
                "avg_margin": round(avg_margin, 2),
                "categories": categories
            }
        }

    except Exception as e:
        logger.error(f"Failed to get product stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def export_products(
    user_id: str = Depends(get_current_user_id),
    format: str = Query("csv", regex="^(csv|json)$"),
    status: Optional[str] = None,
    category: Optional[str] = None,
):
    """Export products as CSV or JSON — creates a job"""
    try:
        supabase = get_supabase()

        # Create export job
        job_data = {
            "user_id": user_id,
            "job_type": "export",
            "status": "running",
            "metadata": {"format": format, "filters": {"status": status, "category": category}},
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        job_result = supabase.table("jobs").insert(job_data).execute()
        job = job_result.data[0]

        # Fetch products
        query = supabase.table("products").select("*").eq("user_id", user_id)
        if status:
            query = query.eq("status", status)
        if category:
            query = query.eq("category", category)
        query = query.order("created_at", desc=True)
        result = query.execute()
        products = result.data or []

        # Update job
        supabase.table("jobs").update({
            "status": "completed",
            "total_items": len(products),
            "processed_items": len(products),
            "progress_percent": 100,
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        if format == "json":
            return {
                "success": True,
                "job_id": job["id"],
                "data": products,
                "count": len(products)
            }

        # CSV format
        if not products:
            return {"success": True, "job_id": job["id"], "csv": "", "count": 0}

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=products[0].keys())
        writer.writeheader()
        writer.writerows(products)

        return {
            "success": True,
            "job_id": job["id"],
            "csv": output.getvalue(),
            "count": len(products)
        }

    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get product with variants, images, and store links"""
    try:
        supabase = get_supabase()

        # Product
        product_result = supabase.table("products").select("*").eq("id", product_id).eq("user_id", user_id).single().execute()
        if not product_result.data:
            raise HTTPException(status_code=404, detail="Product not found")

        # Variants
        variants_result = supabase.table("product_variants").select("*").eq("product_id", product_id).order("position").execute()
        # Images
        images_result = supabase.table("product_images").select("*").eq("product_id", product_id).order("position").execute()
        # Store links
        store_links_result = supabase.table("product_store_links").select("*, stores(name, platform, domain)").eq("product_id", product_id).execute()

        return {
            "success": True,
            "product": {
                **product_result.data,
                "variants": variants_result.data or [],
                "images": images_result.data or [],
                "store_links": store_links_result.data or [],
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get product: {e}")
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

        result = supabase.table("products").update(update_data).eq("id", product_id).eq("user_id", user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Product not found")

        return {"success": True, "product": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a product (cascades to variants, images, store links)"""
    try:
        supabase = get_supabase()
        supabase.table("products").delete().eq("id", product_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Product deleted"}
    except Exception as e:
        logger.error(f"Failed to delete product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# === BULK ACTIONS ===

@router.patch("/bulk/update")
async def bulk_update(
    request: BulkUpdateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Bulk update products — creates a job with job_items"""
    try:
        supabase = get_supabase()

        # Create job
        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "bulk_edit",
            "status": "running",
            "total_items": len(request.product_ids),
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        success = 0
        failed = 0

        for pid in request.product_ids:
            try:
                before = supabase.table("products").select("*").eq("id", pid).eq("user_id", user_id).single().execute()
                updates = {**request.updates, "updated_at": datetime.utcnow().isoformat()}
                supabase.table("products").update(updates).eq("id", pid).eq("user_id", user_id).execute()

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": pid,
                    "status": "success",
                    "before_state": before.data if before.data else {},
                    "after_state": updates,
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                success += 1
            except Exception as e:
                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": pid,
                    "status": "failed",
                    "message": str(e),
                    "error_code": "UPDATE_FAILED",
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                failed += 1

        supabase.table("jobs").update({
            "status": "completed",
            "processed_items": success + failed,
            "failed_items": failed,
            "progress_percent": 100,
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "results": {"success": success, "failed": failed}
        }

    except Exception as e:
        logger.error(f"Bulk update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk/delete")
async def bulk_delete(
    request: BulkDeleteRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Bulk delete products"""
    try:
        supabase = get_supabase()

        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "bulk_edit",
            "status": "running",
            "total_items": len(request.product_ids),
            "metadata": {"action": "delete"},
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        supabase.table("products").delete().in_("id", request.product_ids).eq("user_id", user_id).execute()

        supabase.table("jobs").update({
            "status": "completed",
            "processed_items": len(request.product_ids),
            "progress_percent": 100,
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "deleted": len(request.product_ids)
        }

    except Exception as e:
        logger.error(f"Bulk delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/bulk/status")
async def bulk_status_update(
    request: BulkStatusRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Bulk update product status"""
    try:
        supabase = get_supabase()

        supabase.table("products").update({
            "status": request.status,
            "updated_at": datetime.utcnow().isoformat()
        }).in_("id", request.product_ids).eq("user_id", user_id).execute()

        return {
            "success": True,
            "updated": len(request.product_ids),
            "status": request.status
        }

    except Exception as e:
        logger.error(f"Bulk status update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/bulk/tags")
async def bulk_tags_update(
    request: BulkTagsRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Bulk add/remove/replace tags on products"""
    try:
        supabase = get_supabase()
        updated = 0

        for pid in request.product_ids:
            try:
                product = supabase.table("products").select("tags").eq("id", pid).eq("user_id", user_id).single().execute()
                if not product.data:
                    continue

                current_tags = product.data.get("tags") or []

                if request.action == "add":
                    new_tags = list(set(current_tags + request.tags))
                elif request.action == "remove":
                    new_tags = [t for t in current_tags if t not in request.tags]
                else:  # replace
                    new_tags = request.tags

                supabase.table("products").update({
                    "tags": new_tags,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("id", pid).eq("user_id", user_id).execute()
                updated += 1
            except Exception:
                pass

        return {"success": True, "updated": updated}

    except Exception as e:
        logger.error(f"Bulk tags update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
