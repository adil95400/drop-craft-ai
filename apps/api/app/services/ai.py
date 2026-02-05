"""
AI Service - Uses Lovable AI Gateway for content generation
"""

import httpx
from typing import Dict, Any, List, Optional
import logging
import json

from app.core.config import settings
from app.core.database import get_supabase

logger = logging.getLogger(__name__)


class AIService:
    """AI content generation using Lovable AI Gateway"""
    
    def __init__(self):
        self.gateway_url = settings.AI_GATEWAY_URL
        self.api_key = settings.LOVABLE_API_KEY
    
    def _call_ai(
        self,
        messages: List[Dict[str, str]],
        model: str = "google/gemini-2.5-flash"
    ) -> str:
        """Call Lovable AI Gateway"""
        
        with httpx.Client(timeout=120) as client:
            response = client.post(
                self.gateway_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False
                }
            )
            
            if response.status_code == 429:
                raise Exception("Rate limit exceeded, please try again later")
            elif response.status_code == 402:
                raise Exception("AI credits exhausted")
            elif response.status_code != 200:
                raise Exception(f"AI Gateway error: {response.status_code}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    def generate_content(
        self,
        product_id: str,
        content_types: List[str],
        language: str = "fr",
        tone: str = "professional"
    ) -> Dict[str, Any]:
        """Generate AI content for a product"""
        
        supabase = get_supabase()
        
        # Fetch product
        result = supabase.table("products").select("*").eq("id", product_id).single().execute()
        
        if not result.data:
            raise ValueError(f"Product not found: {product_id}")
        
        product = result.data
        generated = {}
        
        for content_type in content_types:
            if content_type == "title":
                generated["title"] = self._generate_title(product, language, tone)
            elif content_type == "description":
                generated["description"] = self._generate_description(product, language, tone)
            elif content_type == "seo_title":
                generated["seo_title"] = self._generate_seo_title(product, language)
            elif content_type == "seo_description":
                generated["seo_description"] = self._generate_seo_description(product, language)
        
        # Update product with generated content
        supabase.table("products").update(generated).eq("id", product_id).execute()
        
        return {"product_id": product_id, "generated": generated}
    
    def _generate_title(self, product: Dict, language: str, tone: str) -> str:
        """Generate optimized product title"""
        
        messages = [
            {
                "role": "system",
                "content": f"""Tu es un expert e-commerce. Génère un titre de produit optimisé.
                
Langue: {language}
Ton: {tone}

Règles:
- Maximum 70 caractères
- Inclure les caractéristiques clés
- Optimisé pour le SEO
- Ne pas utiliser de guillemets dans la réponse"""
            },
            {
                "role": "user",
                "content": f"""Produit actuel:
Nom: {product.get('title', '')}
Description: {product.get('description', '')[:500]}
Catégorie: {product.get('category', '')}

Génère un titre optimisé (réponds uniquement avec le titre, sans guillemets):"""
            }
        ]
        
        return self._call_ai(messages).strip().strip('"')
    
    def _generate_description(self, product: Dict, language: str, tone: str) -> str:
        """Generate compelling product description"""
        
        messages = [
            {
                "role": "system",
                "content": f"""Tu es un copywriter e-commerce expert. Génère une description de produit persuasive.
                
Langue: {language}
Ton: {tone}

Règles:
- 150-300 mots
- Structure avec des paragraphes courts
- Mettre en avant les bénéfices client
- Inclure un appel à l'action subtil
- Optimisé pour le SEO"""
            },
            {
                "role": "user",
                "content": f"""Produit:
Nom: {product.get('title', '')}
Description originale: {product.get('description', '')[:1000]}
Catégorie: {product.get('category', '')}
Prix: {product.get('sale_price', '')}

Génère une description persuasive:"""
            }
        ]
        
        return self._call_ai(messages)
    
    def _generate_seo_title(self, product: Dict, language: str) -> str:
        """Generate SEO meta title"""
        
        messages = [
            {
                "role": "system",
                "content": f"""Génère un meta title SEO optimisé.
Langue: {language}

Règles:
- Maximum 60 caractères
- Inclure le mot-clé principal
- Inciter au clic"""
            },
            {
                "role": "user",
                "content": f"Produit: {product.get('title', '')}\nCatégorie: {product.get('category', '')}\n\nMeta title:"
            }
        ]
        
        return self._call_ai(messages).strip().strip('"')
    
    def _generate_seo_description(self, product: Dict, language: str) -> str:
        """Generate SEO meta description"""
        
        messages = [
            {
                "role": "system",
                "content": f"""Génère une meta description SEO.
Langue: {language}

Règles:
- Maximum 155 caractères
- Inciter au clic
- Inclure le mot-clé principal"""
            },
            {
                "role": "user",
                "content": f"Produit: {product.get('title', '')}\nDescription: {product.get('description', '')[:300]}\n\nMeta description:"
            }
        ]
        
        return self._call_ai(messages).strip().strip('"')
    
    def optimize_seo(
        self,
        product_id: str,
        keywords: Optional[List[str]] = None,
        language: str = "fr"
    ) -> Dict[str, Any]:
        """Optimize product SEO"""
        
        supabase = get_supabase()
        result = supabase.table("products").select("*").eq("id", product_id).single().execute()
        
        if not result.data:
            raise ValueError(f"Product not found: {product_id}")
        
        product = result.data
        
        # Generate SEO content
        seo_title = self._generate_seo_title(product, language)
        seo_description = self._generate_seo_description(product, language)
        
        # Update product
        supabase.table("products").update({
            "seo_title": seo_title,
            "seo_description": seo_description
        }).eq("id", product_id).execute()
        
        return {
            "product_id": product_id,
            "seo_title": seo_title,
            "seo_description": seo_description
        }
    
    def enrich_product(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich product data with AI"""
        
        if not product.get("description") or len(product.get("description", "")) < 50:
            product["description"] = self._generate_description(
                product, 
                language="fr", 
                tone="professional"
            )
        
        return product
    
    def enrich_product_by_id(self, product_id: str, enrichment_types: List[str]):
        """Enrich existing product by ID"""
        
        supabase = get_supabase()
        result = supabase.table("products").select("*").eq("id", product_id).single().execute()
        
        if not result.data:
            return
        
        product = result.data
        updates = {}
        
        if "description" in enrichment_types:
            updates["description"] = self._generate_description(product, "fr", "professional")
        
        if "seo" in enrichment_types:
            updates["seo_title"] = self._generate_seo_title(product, "fr")
            updates["seo_description"] = self._generate_seo_description(product, "fr")
        
        if updates:
            supabase.table("products").update(updates).eq("id", product_id).execute()
