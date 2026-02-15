"""
SEO endpoints — audits, pages, issues, AI generation, fixes, export
All actions follow jobs-first pattern
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging
import csv
import io

from app.core.security import get_current_user_id
from app.core.database import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request schemas ──────────────────────────────────────────

class CreateAuditRequest(BaseModel):
    mode: str  # single_url | sitemap | crawl
    base_url: str
    sitemap_url: Optional[str] = None
    max_urls: int = 200
    max_depth: Optional[int] = None
    rate_limit_rps: float = 1.0
    respect_robots: bool = True
    include_query_params: bool = False
    page_type_filters: List[str] = []
    url_patterns_include: List[str] = []
    url_patterns_exclude: List[str] = []
    store_id: Optional[str] = None


class AIGenerateRequest(BaseModel):
    type: str  # meta_description | title | h1 | alt_text | faq
    page_id: Optional[str] = None
    url: Optional[str] = None
    language: str = "fr"
    tone: str = "professional"
    keywords: List[str] = []
    variants: int = 3


class ApplyFixRequest(BaseModel):
    store_id: Optional[str] = None
    page_id: Optional[str] = None
    product_id: Optional[str] = None
    action: str  # APPLY_TITLE | APPLY_META | APPLY_H1 | APPLY_ALT | APPLY_CANONICAL
    payload: dict = {}


# ── A) Audits ────────────────────────────────────────────────

@router.post("/audits")
async def create_audit(
    request: CreateAuditRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Launch an SEO audit — creates audit row + background job"""
    try:
        supabase = get_supabase()

        audit = supabase.table("seo_audits").insert({
            "user_id": user_id,
            "store_id": request.store_id,
            "mode": request.mode,
            "base_url": request.base_url,
            "sitemap_url": request.sitemap_url,
            "status": "queued",
            "requested_by": user_id,
            "max_urls": request.max_urls,
            "max_depth": request.max_depth,
            "rate_limit_rps": request.rate_limit_rps,
            "respect_robots": request.respect_robots,
            "include_query_params": request.include_query_params,
            "page_type_filters": request.page_type_filters,
            "url_patterns_include": request.url_patterns_include,
            "url_patterns_exclude": request.url_patterns_exclude,
        }).execute().data[0]

        # Create job in unified `jobs` table
        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "seo_audit",
            "job_subtype": request.mode,
            "status": "pending",
            "name": f"SEO Audit: {request.base_url}",
            "input_data": {"audit_id": audit["id"]},
            "metadata": {"base_url": request.base_url, "mode": request.mode},
        }).execute().data[0]

        return {
            "audit_id": audit["id"],
            "job_id": job["id"],
            "status": "queued",
        }

    except Exception as e:
        logger.error(f"Create audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audits")
async def list_audits(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List user's SEO audits"""
    try:
        supabase = get_supabase()
        offset = (page - 1) * limit

        result = supabase.table("seo_audits") \
            .select("*", count="exact") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()

        return {
            "items": result.data or [],
            "page": page,
            "limit": limit,
            "total": result.count or 0,
        }

    except Exception as e:
        logger.error(f"List audits failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audits/{audit_id}")
async def get_audit(
    audit_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get audit status + summary"""
    try:
        supabase = get_supabase()
        result = supabase.table("seo_audits") \
            .select("*") \
            .eq("id", audit_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Audit not found")

        audit = result.data

        # Count pages
        pages_result = supabase.table("seo_audit_pages") \
            .select("id", count="exact") \
            .eq("audit_id", audit_id) \
            .execute()

        return {
            "audit_id": audit["id"],
            "status": audit["status"],
            "mode": audit["mode"],
            "base_url": audit["base_url"],
            "progress": {
                "discovered": audit.get("summary", {}).get("discovered", 0),
                "processed": pages_result.count or 0,
                "failed": audit.get("summary", {}).get("failed", 0),
            },
            "summary": audit.get("summary", {}),
            "started_at": audit.get("started_at"),
            "finished_at": audit.get("finished_at"),
            "created_at": audit["created_at"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── B) Pages ─────────────────────────────────────────────────

@router.get("/audits/{audit_id}/pages")
async def list_audit_pages(
    audit_id: str,
    user_id: str = Depends(get_current_user_id),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    sort: str = Query("score_desc"),
    page_type: Optional[str] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    has_critical: Optional[bool] = None,
):
    """Paginated list of analyzed pages for an audit"""
    try:
        supabase = get_supabase()

        # Verify ownership
        audit = supabase.table("seo_audits") \
            .select("id") \
            .eq("id", audit_id) \
            .eq("user_id", user_id) \
            .single().execute()
        if not audit.data:
            raise HTTPException(status_code=404, detail="Audit not found")

        offset = (page - 1) * limit
        query = supabase.table("seo_audit_pages") \
            .select("id, url, page_type, http_status, score, issues_summary, title, meta_description, h1", count="exact") \
            .eq("audit_id", audit_id)

        if page_type:
            query = query.eq("page_type", page_type)
        if min_score is not None:
            query = query.gte("score", min_score)
        if max_score is not None:
            query = query.lte("score", max_score)

        # Sort
        if sort == "score_asc":
            query = query.order("score", desc=False)
        else:
            query = query.order("score", desc=True)

        result = query.range(offset, offset + limit - 1).execute()

        return {
            "items": result.data or [],
            "page": page,
            "limit": limit,
            "total": result.count or 0,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"List pages failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── C) Issues ────────────────────────────────────────────────

@router.get("/pages/{page_id}/issues")
async def list_page_issues(
    page_id: str,
    user_id: str = Depends(get_current_user_id),
    severity: Optional[str] = None,
):
    """Get issues for a specific analyzed page"""
    try:
        supabase = get_supabase()

        # Verify ownership via audit
        page = supabase.table("seo_audit_pages") \
            .select("audit_id").eq("id", page_id).single().execute()
        if not page.data:
            raise HTTPException(status_code=404, detail="Page not found")

        audit = supabase.table("seo_audits") \
            .select("id").eq("id", page.data["audit_id"]).eq("user_id", user_id).single().execute()
        if not audit.data:
            raise HTTPException(status_code=403, detail="Not authorized")

        query = supabase.table("seo_issues") \
            .select("*") \
            .eq("page_id", page_id)

        if severity:
            query = query.eq("severity", severity)

        result = query.order("created_at", desc=False).execute()

        return {"items": result.data or []}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"List issues failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── D) AI Generation ────────────────────────────────────────

@router.post("/ai/generate")
async def ai_generate(
    request: AIGenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Generate SEO content via AI — creates a job for traceability"""
    try:
        supabase = get_supabase()

        # Resolve audit_id from page_id if provided
        audit_id = None
        if request.page_id:
            page = supabase.table("seo_audit_pages") \
                .select("audit_id").eq("id", request.page_id).single().execute()
            if page.data:
                audit_id = page.data["audit_id"]

        gen = supabase.table("seo_ai_generations").insert({
            "user_id": user_id,
            "audit_id": audit_id,
            "page_id": request.page_id,
            "url": request.url,
            "type": request.type,
            "language": request.language,
            "tone": request.tone,
            "input": {
                "keywords": request.keywords,
                "variants": request.variants,
            },
        }).execute().data[0]

        # Create job in unified `jobs` table
        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "ai_generation",
            "job_subtype": "seo",
            "status": "pending",
            "name": f"SEO AI: {request.type}",
            "input_data": {"generation_id": gen["id"]},
        }).execute().data[0]

        return {
            "generation_id": gen["id"],
            "job_id": job["id"],
            "status": "queued",
        }

    except Exception as e:
        logger.error(f"AI generate failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/generations/{generation_id}")
async def get_generation(
    generation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get AI generation result"""
    try:
        supabase = get_supabase()
        result = supabase.table("seo_ai_generations") \
            .select("*") \
            .eq("id", generation_id) \
            .eq("user_id", user_id) \
            .single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Generation not found")

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── E) Fixes ─────────────────────────────────────────────────

@router.post("/fixes/apply")
async def apply_fix(
    request: ApplyFixRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Apply an SEO fix — creates a tracked fix + background job"""
    try:
        supabase = get_supabase()

        fix = supabase.table("seo_fix_applies").insert({
            "user_id": user_id,
            "store_id": request.store_id,
            "page_id": request.page_id,
            "product_id": request.product_id,
            "action": request.action,
            "payload": request.payload,
            "status": "queued",
        }).execute().data[0]

        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "seo_audit",
            "job_subtype": "fix",
            "status": "pending",
            "name": f"SEO Fix: {request.action}",
            "input_data": {"fix_id": fix["id"]},
        }).execute().data[0]

        # Update fix with job_id
        supabase.table("seo_fix_applies") \
            .update({"job_id": job["id"]}) \
            .eq("id", fix["id"]).execute()

        return {
            "fix_id": fix["id"],
            "job_id": job["id"],
            "status": "queued",
        }

    except Exception as e:
        logger.error(f"Apply fix failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── F) Export ────────────────────────────────────────────────

@router.get("/audits/{audit_id}/export")
async def export_audit(
    audit_id: str,
    user_id: str = Depends(get_current_user_id),
    format: str = Query("csv"),
):
    """Export audit results as CSV, XLSX or JSON"""
    try:
        supabase = get_supabase()

        # Verify ownership
        audit = supabase.table("seo_audits") \
            .select("id, base_url") \
            .eq("id", audit_id) \
            .eq("user_id", user_id) \
            .single().execute()
        if not audit.data:
            raise HTTPException(status_code=404, detail="Audit not found")

        # Fetch all pages (up to 1000)
        pages = supabase.table("seo_audit_pages") \
            .select("url, page_type, http_status, score, title_length, meta_description_length, images_missing_alt_count, issues_summary") \
            .eq("audit_id", audit_id) \
            .order("score", desc=True) \
            .execute().data or []

        if format == "json":
            return {"items": pages, "audit_id": audit_id}

        # CSV export
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "url", "page_type", "http_status", "score",
            "title_length", "meta_description_length",
            "images_missing_alt_count", "critical", "major", "minor",
        ])
        writer.writeheader()
        for p in pages:
            summary = p.get("issues_summary") or {}
            writer.writerow({
                "url": p.get("url"),
                "page_type": p.get("page_type"),
                "http_status": p.get("http_status"),
                "score": p.get("score"),
                "title_length": p.get("title_length"),
                "meta_description_length": p.get("meta_description_length"),
                "images_missing_alt_count": p.get("images_missing_alt_count"),
                "critical": summary.get("critical", 0),
                "major": summary.get("major", 0),
                "minor": summary.get("minor", 0),
            })

        output.seek(0)
        filename = f"seo-audit-{audit_id[:8]}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
