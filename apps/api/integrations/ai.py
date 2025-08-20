"""
OpenAI Integration - Real AI services for SEO and content generation
"""

import openai
import os
from typing import List, Optional, Dict, Any
import structlog
from utils.database import get_supabase_client

logger = structlog.get_logger()

class OpenAIService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if self.api_key:
            openai.api_key = self.api_key
        
    async def generate_seo_content(self, product_title: str, description: str = "", language: str = "fr") -> Dict[str, Any]:
        """Generate SEO content for a product"""
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        prompt = self._build_seo_prompt(product_title, description, language)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": f"You are an expert SEO copywriter specializing in e-commerce product optimization in {language}."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            # Parse the structured response
            seo_data = self._parse_seo_response(content)
            
            return seo_data
            
        except Exception as e:
            logger.error(f"OpenAI SEO generation error: {str(e)}")
            raise
    
    async def generate_product_description(self, product_title: str, specs: Dict[str, Any] = {}, language: str = "fr") -> str:
        """Generate a compelling product description"""
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        specs_text = ""
        if specs:
            specs_text = "\nSpécifications:\n" + "\n".join([f"- {k}: {v}" for k, v in specs.items()])
        
        prompt = f"""
        Écrivez une description de produit e-commerce convaincante et professionnelle pour:
        
        Produit: {product_title}
        {specs_text}
        
        La description doit:
        - Être engageante et persuasive
        - Mettre en avant les bénéfices client
        - Être optimisée pour le SEO
        - Faire entre 150-300 mots
        - Être en français
        - Inclure des mots-clés pertinents naturellement
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Vous êtes un expert en copywriting e-commerce français."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.8
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI description generation error: {str(e)}")
            raise
    
    async def generate_keywords(self, product_title: str, category: str = "", language: str = "fr") -> List[str]:
        """Generate SEO keywords for a product"""
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        prompt = f"""
        Générez une liste de 10-15 mots-clés SEO pertinents pour ce produit e-commerce:
        
        Produit: {product_title}
        Catégorie: {category}
        
        Les mots-clés doivent:
        - Être en français
        - Inclure des termes de recherche populaires
        - Couvrir différentes intentions (achat, comparaison, information)
        - Être variés (mots courts et longue traîne)
        
        Répondez avec seulement la liste des mots-clés séparés par des virgules.
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Vous êtes un expert SEO français."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.6
            )
            
            keywords_text = response.choices[0].message.content.strip()
            keywords = [kw.strip() for kw in keywords_text.split(',')]
            
            return keywords[:15]  # Limit to 15 keywords
            
        except Exception as e:
            logger.error(f"OpenAI keywords generation error: {str(e)}")
            return []
    
    async def generate_seo_for_product(self, product_id: str, user_id: str, language: str = "fr"):
        """Generate complete SEO package for a product and update database"""
        try:
            supabase = get_supabase_client()
            
            # Get product from database
            result = supabase.table('products').select("*").eq('id', product_id).eq('user_id', user_id).execute()
            
            if not result.data:
                raise ValueError(f"Product {product_id} not found")
            
            product = result.data[0]
            
            logger.info(f"Generating SEO content for product: {product['title']}")
            
            # Generate SEO content
            seo_content = await self.generate_seo_content(
                product['title'], 
                product.get('description', ''), 
                language
            )
            
            # Generate additional description if needed
            if not product.get('description') or len(product.get('description', '')) < 100:
                new_description = await self.generate_product_description(
                    product['title'],
                    product.get('attributes', {}),
                    language
                )
                seo_content['description'] = new_description
            
            # Update product with SEO data
            update_data = {
                'seo_title': seo_content.get('title'),
                'seo_description': seo_content.get('meta_description'),
                'seo_keywords': seo_content.get('keywords', []),
            }
            
            if seo_content.get('description'):
                update_data['description'] = seo_content['description']
            
            supabase.table('products').update(update_data).eq('id', product_id).execute()
            
            logger.info(f"SEO content generated and saved for product {product_id}")
            
        except Exception as e:
            logger.error(f"Error generating SEO for product {product_id}: {str(e)}")
            raise
    
    async def analyze_product_performance(self, product_data: Dict[str, Any], language: str = "fr") -> Dict[str, Any]:
        """Analyze product performance and provide recommendations"""
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        prompt = f"""
        Analysez la performance de ce produit e-commerce et donnez des recommandations:
        
        Produit: {product_data.get('title', '')}
        Prix: {product_data.get('sale_price', 0)}€
        Marge: {product_data.get('profit_margin', 0)}%
        Stock: {product_data.get('stock', 0)}
        Ventes: {product_data.get('sales_count', 0)}
        
        Fournissez une analyse structurée avec:
        1. Performance globale (1-10)
        2. Points forts
        3. Points d'amélioration
        4. Recommandations d'optimisation prix
        5. Recommandations marketing
        
        Réponse en français, format JSON.
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Vous êtes un consultant e-commerce expert en analyse de performance produit."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.3
            )
            
            analysis = response.choices[0].message.content
            
            # Try to parse as JSON, fallback to text
            try:
                import json
                return json.loads(analysis)
            except:
                return {"analysis": analysis}
                
        except Exception as e:
            logger.error(f"Product analysis error: {str(e)}")
            return {}
    
    def _build_seo_prompt(self, title: str, description: str, language: str) -> str:
        """Build SEO generation prompt"""
        return f"""
        Créez un contenu SEO optimisé pour ce produit e-commerce:
        
        Titre du produit: {title}
        Description existante: {description[:200]}
        
        Générez:
        1. Un titre SEO optimisé (50-60 caractères)
        2. Une méta-description accrocheuse (150-160 caractères)
        3. 10 mots-clés pertinents
        4. Une description produit améliorée (200-300 mots) si nécessaire
        
        Le contenu doit:
        - Être en français
        - Être optimisé pour les moteurs de recherche
        - Inclure des mots-clés naturellement
        - Être attractif pour les clients
        
        Répondez au format:
        TITRE SEO: [titre]
        META DESCRIPTION: [meta]
        MOTS-CLÉS: [mot1, mot2, mot3...]
        DESCRIPTION: [description améliorée]
        """
    
    def _parse_seo_response(self, content: str) -> Dict[str, Any]:
        """Parse structured SEO response from OpenAI"""
        seo_data = {
            'title': '',
            'meta_description': '',
            'keywords': [],
            'description': ''
        }
        
        lines = content.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('TITRE SEO:'):
                seo_data['title'] = line.replace('TITRE SEO:', '').strip()
            elif line.startswith('META DESCRIPTION:'):
                seo_data['meta_description'] = line.replace('META DESCRIPTION:', '').strip()
            elif line.startswith('MOTS-CLÉS:'):
                keywords_text = line.replace('MOTS-CLÉS:', '').strip()
                seo_data['keywords'] = [kw.strip() for kw in keywords_text.split(',')]
            elif line.startswith('DESCRIPTION:'):
                current_section = 'description'
                desc_text = line.replace('DESCRIPTION:', '').strip()
                if desc_text:
                    seo_data['description'] = desc_text
            elif current_section == 'description' and line:
                seo_data['description'] += ' ' + line
        
        return seo_data