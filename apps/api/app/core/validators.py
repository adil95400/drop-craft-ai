"""
Pre-flight validation for imports.
Validates file size, format, column presence, and URL reachability
BEFORE enqueuing Celery tasks (fail-fast pattern).
"""

from fastapi import HTTPException, UploadFile
from typing import Optional, Dict, List
import logging
import csv
import io

logger = logging.getLogger(__name__)

# Limits
MAX_CSV_SIZE_MB = 50
MAX_CSV_ROWS = 50_000
REQUIRED_COLUMNS = {"title"}  # Minimum: at least a product title
SUPPORTED_CSV_TYPES = {"text/csv", "application/vnd.ms-excel"}
SUPPORTED_EXCEL_TYPES = {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
ALLOWED_CONTENT_TYPES = SUPPORTED_CSV_TYPES | SUPPORTED_EXCEL_TYPES


async def validate_import_file(file: UploadFile) -> Dict:
    """
    Validate an uploaded import file before processing.
    Returns metadata dict with file_size, row_count, columns.
    Raises HTTPException on failure.
    """
    # 1. Content type check
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use CSV or Excel."
        )

    # 2. Read content and check size
    content = await file.read()
    await file.seek(0)  # Reset for downstream

    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_CSV_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {size_mb:.1f}MB (max {MAX_CSV_SIZE_MB}MB)"
        )

    is_excel = file.content_type in SUPPORTED_EXCEL_TYPES
    metadata = {"file_size_mb": round(size_mb, 2), "is_excel": is_excel}

    # 3. For CSV: validate structure
    if not is_excel:
        try:
            text = content.decode("utf-8")
            reader = csv.DictReader(io.StringIO(text))
            columns = reader.fieldnames or []

            if not columns:
                raise HTTPException(status_code=400, detail="CSV file has no columns")

            # Normalize column names for comparison
            normalized = {c.strip().lower() for c in columns}
            missing = REQUIRED_COLUMNS - normalized

            # Also accept 'name' as alias for 'title'
            if "title" in missing and "name" in normalized:
                missing.discard("title")

            if missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required columns: {', '.join(missing)}. Found: {', '.join(columns[:10])}"
                )

            # Count rows (cap check)
            row_count = sum(1 for _ in reader)
            if row_count > MAX_CSV_ROWS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Too many rows: {row_count} (max {MAX_CSV_ROWS})"
                )

            metadata["row_count"] = row_count
            metadata["columns"] = columns[:20]

        except HTTPException:
            raise
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File encoding not supported. Use UTF-8.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)[:200]}")

    return metadata


async def validate_import_url(url: str, format: str = "csv") -> Dict:
    """
    Validate a URL is reachable and returns expected content type.
    """
    import httpx

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.head(url)

            if response.status_code >= 400:
                raise HTTPException(
                    status_code=400,
                    detail=f"URL returned status {response.status_code}. Ensure the URL is publicly accessible."
                )

            content_type = response.headers.get("content-type", "")
            content_length = response.headers.get("content-length")

            # Size check if header available
            if content_length:
                size_mb = int(content_length) / (1024 * 1024)
                if size_mb > MAX_CSV_SIZE_MB:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Remote file too large: {size_mb:.1f}MB (max {MAX_CSV_SIZE_MB}MB)"
                    )

            return {
                "url": url,
                "content_type": content_type,
                "reachable": True,
            }

    except HTTPException:
        raise
    except httpx.ConnectError:
        raise HTTPException(status_code=400, detail="Cannot connect to URL. Check the address.")
    except httpx.TimeoutException:
        raise HTTPException(status_code=400, detail="URL timed out after 15s. Try again later.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL validation failed: {str(e)[:200]}")
