"""
Scraping Service - Extract product data from various sources
Uses Firecrawl for web scraping when available
"""

import httpx
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
import re
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class ScrapingService:
    """Universal product scraping service"""
    
    SUPPORTED_PLATFORMS = {
        "aliexpress": ["aliexpress.com", "aliexpress.us"],
        "amazon": ["amazon.com", "amazon.fr", "amazon.de", "amazon.co.uk"],
        "ebay": ["ebay.com", "ebay.fr"],
        "etsy": ["etsy.com"],
        "shopify": [],  # Detected by meta tags
        "temu": ["temu.com"],
        "shein": ["shein.com", "shein.fr"]
    }
    
    def __init__(self):
        self.firecrawl_key = settings.FIRECRAWL_API_KEY
        self.firecrawl_url = "https://api.firecrawl.dev/v1"
    
    def detect_platform(self, url: str) -> Optional[str]:
        """Detect e-commerce platform from URL"""
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace("www.", "")
        
        for platform, domains in self.SUPPORTED_PLATFORMS.items():
            for d in domains:
                if d in domain:
                    return platform
        
        return "generic"
    
    def scrape_product(
        self,
        url: str,
        extract_variants: bool = True,
        extract_reviews: bool = False
    ) -> Dict[str, Any]:
        """Scrape product data from URL"""
        
        platform = self.detect_platform(url)
        logger.info(f"Scraping {platform} product: {url}")
        
        # Try Firecrawl first if available
        if self.firecrawl_key:
            return self._scrape_with_firecrawl(url, extract_variants, extract_reviews)
        
        # Fallback to platform-specific scraping
        if platform == "aliexpress":
            return self._scrape_aliexpress(url)
        elif platform == "amazon":
            return self._scrape_amazon(url)
        else:
            return self._scrape_generic(url)
    
    def _scrape_with_firecrawl(
        self,
        url: str,
        extract_variants: bool = True,
        extract_reviews: bool = False
    ) -> Dict[str, Any]:
        """Use Firecrawl API for scraping"""
        
        # Define JSON schema for product extraction
        product_schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "price": {"type": "number"},
                "original_price": {"type": "number"},
                "currency": {"type": "string"},
                "images": {"type": "array", "items": {"type": "string"}},
                "sku": {"type": "string"},
                "brand": {"type": "string"},
                "category": {"type": "string"},
                "availability": {"type": "string"},
                "rating": {"type": "number"},
                "review_count": {"type": "integer"},
                "variants": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "options": {"type": "array", "items": {"type": "string"}}
                        }
                    }
                },
                "specifications": {"type": "object"}
            }
        }
        
        formats = [{"type": "json", "schema": product_schema}]
        if extract_reviews:
            formats.append("markdown")
        
        with httpx.Client(timeout=60) as client:
            response = client.post(
                f"{self.firecrawl_url}/scrape",
                headers={
                    "Authorization": f"Bearer {self.firecrawl_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "url": url,
                    "formats": formats,
                    "onlyMainContent": True
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Firecrawl error: {response.text}")
                return self._scrape_generic(url)
            
            data = response.json()
            
            # Extract from response
            product_data = data.get("data", {}).get("json", {}) or data.get("json", {})
            
            # Normalize the data
            return self._normalize_product(product_data, url)
    
    def _scrape_aliexpress(self, url: str) -> Dict[str, Any]:
        """AliExpress-specific scraping logic"""
        # Implementation would use specific parsing for AliExpress
        logger.warning("AliExpress scraping without Firecrawl - limited functionality")
        return self._scrape_generic(url)
    
    def _scrape_amazon(self, url: str) -> Dict[str, Any]:
        """Amazon-specific scraping logic"""
        logger.warning("Amazon scraping without Firecrawl - limited functionality")
        return self._scrape_generic(url)
    
    def _scrape_generic(self, url: str) -> Dict[str, Any]:
        """Generic scraping fallback"""
        
        with httpx.Client(timeout=30) as client:
            response = client.get(url, follow_redirects=True)
            html = response.text
        
        # Extract basic info from HTML
        title = self._extract_meta(html, "og:title") or self._extract_title(html)
        description = self._extract_meta(html, "og:description")
        image = self._extract_meta(html, "og:image")
        
        # Try to find price in page
        price = self._extract_price(html)
        
        return {
            "title": title or "Unknown Product",
            "description": description or "",
            "sale_price": price,
            "images": [image] if image else [],
            "source_url": url,
            "source_platform": self.detect_platform(url)
        }
    
    def _normalize_product(self, data: Dict[str, Any], url: str) -> Dict[str, Any]:
        """Normalize scraped data to standard format"""
        
        return {
            "title": data.get("title", ""),
            "description": data.get("description", ""),
            "sale_price": data.get("price", 0),
            "cost_price": data.get("original_price"),
            "currency": data.get("currency", "EUR"),
            "images": data.get("images", []),
            "sku": data.get("sku"),
            "brand": data.get("brand"),
            "category": data.get("category"),
            "stock": 100 if data.get("availability") == "in_stock" else 0,
            "rating": data.get("rating"),
            "review_count": data.get("review_count"),
            "variants": data.get("variants", []),
            "attributes": data.get("specifications", {}),
            "source_url": url,
            "source_platform": self.detect_platform(url)
        }
    
    def _extract_meta(self, html: str, property_name: str) -> Optional[str]:
        """Extract OpenGraph meta content"""
        pattern = rf'<meta[^>]*property=["\']?{property_name}["\']?[^>]*content=["\']?([^"\'>\s]+)["\']?'
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            return match.group(1)
        return None
    
    def _extract_title(self, html: str) -> Optional[str]:
        """Extract title from HTML"""
        match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return None
    
    def _extract_price(self, html: str) -> Optional[float]:
        """Try to extract price from HTML"""
        # Common price patterns
        patterns = [
            r'[\$€£](\d+[.,]?\d*)',
            r'(\d+[.,]?\d*)\s*(?:EUR|USD|GBP|€|\$|£)',
            r'price["\']?\s*:\s*["\']?(\d+[.,]?\d*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                price_str = match.group(1).replace(",", ".")
                try:
                    return float(price_str)
                except ValueError:
                    continue
        
        return None
    
    def scrape_store(
        self,
        store_url: str,
        max_products: int = 100,
        category_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Scrape multiple products from a store"""
        
        if not self.firecrawl_key:
            logger.error("Store scraping requires Firecrawl API")
            return []
        
        # First, map the store to find product URLs
        with httpx.Client(timeout=60) as client:
            response = client.post(
                f"{self.firecrawl_url}/map",
                headers={
                    "Authorization": f"Bearer {self.firecrawl_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "url": store_url,
                    "search": category_filter or "product",
                    "limit": max_products * 2  # Get more links than needed
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Store mapping failed: {response.text}")
                return []
            
            data = response.json()
            product_urls = data.get("links", [])
        
        # Filter to likely product URLs
        product_urls = self._filter_product_urls(product_urls)[:max_products]
        
        # Scrape each product
        products = []
        for url in product_urls:
            try:
                product = self.scrape_product(url)
                if product.get("title"):
                    products.append(product)
            except Exception as e:
                logger.warning(f"Failed to scrape {url}: {e}")
        
        return products
    
    def _filter_product_urls(self, urls: List[str]) -> List[str]:
        """Filter URLs to likely product pages"""
        product_patterns = [
            r'/product[s]?/',
            r'/p/',
            r'/item/',
            r'/dp/',  # Amazon
            r'/itm/',  # eBay
            r'/listing/',  # Etsy
        ]
        
        filtered = []
        for url in urls:
            for pattern in product_patterns:
                if re.search(pattern, url, re.IGNORECASE):
                    filtered.append(url)
                    break
        
        return filtered
