"""
Import Service - Handle CSV, XML, JSON imports
"""

import csv
import json
import io
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx
import logging
from xml.etree import ElementTree

from app.core.database import get_supabase

logger = logging.getLogger(__name__)


class ImportService:
    """Universal import service for various data formats"""
    
    # Default column mappings for common formats
    DEFAULT_MAPPINGS = {
        "csv": {
            "title": ["title", "name", "product_name", "product_title", "nom", "titre"],
            "description": ["description", "desc", "body", "body_html", "content"],
            "price": ["price", "sale_price", "prix", "retail_price", "selling_price"],
            "cost": ["cost", "cost_price", "wholesale", "buy_price", "cout"],
            "sku": ["sku", "reference", "ref", "product_id", "item_number"],
            "stock": ["stock", "qty", "quantity", "inventory", "stock_quantity"],
            "images": ["images", "image_url", "image", "picture", "photo"],
            "category": ["category", "categorie", "type", "product_type"]
        }
    }
    
    def import_from_url(
        self,
        user_id: str,
        url: str,
        format: str = "csv",
        mapping: Dict[str, str] = None,
        update_existing: bool = True
    ) -> Dict[str, Any]:
        """Import products from a URL (CSV, XML, JSON feed)"""
        
        logger.info(f"Importing from URL: {url} (format: {format})")
        
        # Download the file
        with httpx.Client(timeout=120) as client:
            response = client.get(url, follow_redirects=True)
            content = response.text
        
        return self.import_from_content(
            user_id=user_id,
            content=content,
            format=format,
            mapping=mapping,
            update_existing=update_existing
        )
    
    def import_from_content(
        self,
        user_id: str,
        content: str,
        format: str = "csv",
        mapping: Dict[str, str] = None,
        update_existing: bool = True
    ) -> Dict[str, Any]:
        """Import products from raw content"""
        
        if format == "csv":
            products = self._parse_csv(content, mapping)
        elif format == "excel":
            products = self._parse_excel(content, mapping)
        elif format == "xml":
            products = self._parse_xml(content, mapping)
        elif format == "json":
            products = self._parse_json(content, mapping)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        # Save products to database
        result = self._save_products(user_id, products, update_existing)
        
        return {
            "total": len(products),
            "imported": result["imported"],
            "updated": result["updated"],
            "errors": result["errors"]
        }
    
    def _parse_csv(self, content: str, mapping: Dict[str, str] = None) -> List[Dict[str, Any]]:
        """Parse CSV content"""
        
        # Detect delimiter
        sample = content[:1000]
        delimiter = ";" if ";" in sample and sample.count(";") > sample.count(",") else ","
        
        reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
        headers = reader.fieldnames or []
        
        # Auto-detect mapping if not provided
        if not mapping:
            mapping = self._auto_detect_mapping(headers, "csv")
        
        products = []
        for row in reader:
            product = self._map_row(row, mapping)
            if product.get("title"):  # Only include valid products
                products.append(product)
        
        return products
    
    def _parse_excel(self, content: bytes, mapping: Dict[str, str] = None) -> List[Dict[str, Any]]:
        """Parse Excel content - would need openpyxl"""
        # Placeholder - would need additional library
        logger.warning("Excel parsing not fully implemented")
        return []
    
    def _parse_xml(self, content: str, mapping: Dict[str, str] = None) -> List[Dict[str, Any]]:
        """Parse XML content"""
        
        root = ElementTree.fromstring(content)
        products = []
        
        # Find product elements (common patterns)
        product_tags = ["product", "item", "entry", "offer"]
        product_elements = []
        
        for tag in product_tags:
            product_elements = root.findall(f".//{tag}")
            if product_elements:
                break
        
        for elem in product_elements:
            product = {}
            
            # Extract all child elements
            for child in elem:
                tag_name = child.tag.lower()
                value = child.text or ""
                
                # Map to standard fields
                if mapping and tag_name in mapping:
                    product[mapping[tag_name]] = value
                else:
                    # Auto-map common fields
                    if tag_name in ["title", "name"]:
                        product["title"] = value
                    elif tag_name in ["description", "desc"]:
                        product["description"] = value
                    elif tag_name in ["price"]:
                        product["sale_price"] = self._parse_price(value)
                    elif tag_name in ["sku", "id", "reference"]:
                        product["sku"] = value
                    elif tag_name in ["image", "image_link"]:
                        product["images"] = [value]
                    elif tag_name in ["availability", "stock"]:
                        product["stock"] = self._parse_stock(value)
            
            if product.get("title"):
                products.append(product)
        
        return products
    
    def _parse_json(self, content: str, mapping: Dict[str, str] = None) -> List[Dict[str, Any]]:
        """Parse JSON content"""
        
        data = json.loads(content)
        
        # Handle different JSON structures
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            # Look for products array
            items = data.get("products") or data.get("items") or data.get("data") or [data]
        else:
            items = []
        
        products = []
        for item in items:
            if isinstance(item, dict):
                product = self._map_json_item(item, mapping)
                if product.get("title"):
                    products.append(product)
        
        return products
    
    def _auto_detect_mapping(self, headers: List[str], format: str) -> Dict[str, str]:
        """Auto-detect column mapping from headers"""
        
        mapping = {}
        field_options = self.DEFAULT_MAPPINGS.get(format, self.DEFAULT_MAPPINGS["csv"])
        
        for field, options in field_options.items():
            for header in headers:
                if header.lower() in [opt.lower() for opt in options]:
                    mapping[header] = field
                    break
        
        return mapping
    
    def _map_row(self, row: Dict[str, str], mapping: Dict[str, str]) -> Dict[str, Any]:
        """Map a row to product format"""
        
        product = {
            "title": "",
            "description": "",
            "sale_price": 0,
            "cost_price": 0,
            "sku": "",
            "stock": 0,
            "images": [],
            "category": ""
        }
        
        for col, field in mapping.items():
            if col in row:
                value = row[col]
                
                if field == "price" or field == "sale_price":
                    product["sale_price"] = self._parse_price(value)
                elif field == "cost" or field == "cost_price":
                    product["cost_price"] = self._parse_price(value)
                elif field == "stock":
                    product["stock"] = self._parse_stock(value)
                elif field == "images":
                    product["images"] = self._parse_images(value)
                else:
                    product[field] = value
        
        return product
    
    def _map_json_item(self, item: Dict[str, Any], mapping: Dict[str, str] = None) -> Dict[str, Any]:
        """Map a JSON item to product format"""
        
        # Direct field access with common field names
        product = {
            "title": item.get("title") or item.get("name") or "",
            "description": item.get("description") or item.get("body_html") or "",
            "sale_price": self._parse_price(item.get("price") or item.get("sale_price") or 0),
            "cost_price": self._parse_price(item.get("cost") or item.get("cost_price") or 0),
            "sku": item.get("sku") or item.get("id") or "",
            "stock": self._parse_stock(item.get("stock") or item.get("quantity") or 0),
            "images": item.get("images") or [],
            "category": item.get("category") or item.get("type") or ""
        }
        
        # Handle nested image structures
        if not product["images"] and item.get("image"):
            if isinstance(item["image"], str):
                product["images"] = [item["image"]]
            elif isinstance(item["image"], dict):
                product["images"] = [item["image"].get("src", "")]
        
        return product
    
    def _parse_price(self, value: Any) -> float:
        """Parse price from various formats"""
        if isinstance(value, (int, float)):
            return float(value)
        
        if isinstance(value, str):
            # Remove currency symbols and spaces
            clean = value.replace("€", "").replace("$", "").replace("£", "").replace(" ", "").strip()
            clean = clean.replace(",", ".")
            
            try:
                return float(clean)
            except ValueError:
                return 0.0
        
        return 0.0
    
    def _parse_stock(self, value: Any) -> int:
        """Parse stock quantity"""
        if isinstance(value, int):
            return value
        
        if isinstance(value, str):
            value_lower = value.lower()
            if value_lower in ["in stock", "available", "en stock", "disponible"]:
                return 100
            elif value_lower in ["out of stock", "unavailable", "rupture", "indisponible"]:
                return 0
            
            try:
                return int(value)
            except ValueError:
                return 0
        
        return 0
    
    def _parse_images(self, value: Any) -> List[str]:
        """Parse images from various formats"""
        if isinstance(value, list):
            return value
        
        if isinstance(value, str):
            # Could be comma-separated or pipe-separated
            if "|" in value:
                return [img.strip() for img in value.split("|") if img.strip()]
            elif "," in value and "http" in value:
                return [img.strip() for img in value.split(",") if img.strip()]
            else:
                return [value] if value.strip() else []
        
        return []
    
    def _save_products(
        self,
        user_id: str,
        products: List[Dict[str, Any]],
        update_existing: bool = True
    ) -> Dict[str, Any]:
        """Save products to database"""
        
        supabase = get_supabase()
        
        imported = 0
        updated = 0
        errors = []
        
        for i, product in enumerate(products):
            try:
                # Check if product exists by SKU
                existing = None
                if product.get("sku"):
                    result = supabase.table("products").select("id").eq(
                        "user_id", user_id
                    ).eq("sku", product["sku"]).execute()
                    
                    if result.data:
                        existing = result.data[0]
                
                if existing and update_existing:
                    # Update existing product
                    supabase.table("products").update({
                        **product,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", existing["id"]).execute()
                    updated += 1
                elif not existing:
                    # Insert new product
                    supabase.table("products").insert({
                        **product,
                        "user_id": user_id,
                        "status": "draft",
                        "created_at": datetime.utcnow().isoformat()
                    }).execute()
                    imported += 1
                    
            except Exception as e:
                errors.append({"index": i, "error": str(e)})
                logger.warning(f"Failed to import product {i}: {e}")
        
        return {
            "imported": imported,
            "updated": updated,
            "errors": errors
        }
