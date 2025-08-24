import asyncio
from typing import Dict, Any, List
import structlog
from datetime import datetime

from ..core.supabase import supabase_client
from ..core.email import send_email
from ..integrations.shopify import ShopifyIntegration
from ..integrations.bigbuy import BigBuyIntegration

logger = structlog.get_logger(__name__)

async def process_bulk_import(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process bulk product import from suppliers
    """
    try:
        user_id = payload.get('user_id')
        supplier = payload.get('supplier')
        product_ids = payload.get('product_ids', [])
        import_options = payload.get('options', {})
        
        logger.info(f"Starting bulk import for user {user_id} from {supplier}")
        
        results = {
            'total': len(product_ids),
            'imported': 0,
            'failed': 0,
            'errors': []
        }
        
        # Initialize supplier integration
        if supplier == 'shopify':
            integration = ShopifyIntegration(user_id)
        elif supplier == 'bigbuy':
            integration = BigBuyIntegration(user_id)
        else:
            raise ValueError(f"Unsupported supplier: {supplier}")
            
        # Process products in batches
        batch_size = 10
        for i in range(0, len(product_ids), batch_size):
            batch = product_ids[i:i + batch_size]
            
            try:
                imported_products = await integration.import_products(
                    product_ids=batch,
                    options=import_options
                )
                
                results['imported'] += len(imported_products)
                
                # Update progress
                progress = min(100, ((i + batch_size) / len(product_ids)) * 100)
                await update_import_progress(user_id, payload.get('import_id'), progress)
                
            except Exception as e:
                error_msg = f"Batch {i//batch_size + 1} failed: {str(e)}"
                results['errors'].append(error_msg)
                results['failed'] += len(batch)
                logger.error(f"Batch import failed", error=str(e))
                
            # Small delay to avoid overwhelming APIs
            await asyncio.sleep(0.1)
            
        # Send completion notification
        await send_notification_email({
            'user_id': user_id,
            'template': 'bulk_import_complete',
            'data': {
                'supplier': supplier,
                'results': results
            }
        })
        
        logger.info(f"Bulk import completed: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Bulk import failed", error=str(e))
        raise

async def sync_product_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sync product data with external platforms
    """
    try:
        user_id = payload.get('user_id')
        product_id = payload.get('product_id')
        platforms = payload.get('platforms', ['shopify'])
        
        logger.info(f"Syncing product {product_id} for user {user_id}")
        
        # Get product data from Supabase
        result = await supabase_client.table('products').select('*').eq('id', product_id).eq('user_id', user_id).single().execute()
        
        if not result.data:
            raise ValueError(f"Product {product_id} not found")
            
        product_data = result.data
        sync_results = {}
        
        for platform in platforms:
            try:
                if platform == 'shopify':
                    integration = ShopifyIntegration(user_id)
                    sync_result = await integration.sync_product(product_data)
                    sync_results[platform] = sync_result
                    
            except Exception as e:
                sync_results[platform] = {'success': False, 'error': str(e)}
                logger.error(f"Failed to sync to {platform}", error=str(e))
                
        return sync_results
        
    except Exception as e:
        logger.error(f"Product sync failed", error=str(e))
        raise

async def send_notification_email(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send notification email to user
    """
    try:
        user_id = payload.get('user_id')
        template = payload.get('template')
        email_data = payload.get('data', {})
        
        # Get user email from Supabase
        result = await supabase_client.table('profiles').select('email, full_name').eq('user_id', user_id).single().execute()
        
        if not result.data:
            raise ValueError(f"User {user_id} not found")
            
        user_email = result.data.get('email')
        user_name = result.data.get('full_name', 'User')
        
        if not user_email:
            logger.warning(f"No email found for user {user_id}")
            return {'success': False, 'reason': 'No email address'}
            
        # Send email using template
        email_sent = await send_email(
            to_email=user_email,
            template_name=template,
            template_data={
                'user_name': user_name,
                **email_data
            }
        )
        
        logger.info(f"Notification email sent to {user_email}")
        return {'success': True, 'email': user_email}
        
    except Exception as e:
        logger.error(f"Failed to send notification email", error=str(e))
        raise

async def generate_reports(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate analytics reports
    """
    try:
        user_id = payload.get('user_id')
        report_type = payload.get('report_type')
        date_range = payload.get('date_range', {})
        
        logger.info(f"Generating {report_type} report for user {user_id}")
        
        report_data = {}
        
        if report_type == 'sales_summary':
            # Generate sales summary report
            result = await supabase_client.rpc('get_sales_summary', {
                'p_user_id': user_id,
                'p_start_date': date_range.get('start'),
                'p_end_date': date_range.get('end')
            }).execute()
            report_data = result.data
            
        elif report_type == 'inventory_report':
            # Generate inventory report
            result = await supabase_client.table('products').select('*').eq('user_id', user_id).execute()
            report_data = result.data
            
        elif report_type == 'performance_metrics':
            # Generate performance metrics
            result = await supabase_client.rpc('get_performance_metrics', {
                'p_user_id': user_id,
                'p_start_date': date_range.get('start'),
                'p_end_date': date_range.get('end')
            }).execute()
            report_data = result.data
            
        # Store report in Supabase
        report_record = {
            'user_id': user_id,
            'report_type': report_type,
            'data': report_data,
            'generated_at': datetime.utcnow().isoformat(),
            'status': 'completed'
        }
        
        await supabase_client.table('reports').insert(report_record).execute()
        
        logger.info(f"Report {report_type} generated successfully")
        return {'success': True, 'report_id': report_record.get('id')}
        
    except Exception as e:
        logger.error(f"Report generation failed", error=str(e))
        raise

async def cleanup_temp_files(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Clean up temporary files and expired data
    """
    try:
        cleanup_type = payload.get('type', 'temp_files')
        older_than_hours = payload.get('older_than_hours', 24)
        
        logger.info(f"Starting {cleanup_type} cleanup")
        
        cleaned_count = 0
        
        if cleanup_type == 'temp_files':
            # Clean up temporary uploaded files
            result = await supabase_client.rpc('cleanup_temp_files', {
                'p_older_than_hours': older_than_hours
            }).execute()
            cleaned_count = result.data or 0
            
        elif cleanup_type == 'expired_sessions':
            # Clean up expired user sessions
            result = await supabase_client.rpc('cleanup_expired_sessions', {
                'p_older_than_hours': older_than_hours
            }).execute()
            cleaned_count = result.data or 0
            
        elif cleanup_type == 'old_logs':
            # Clean up old log entries
            result = await supabase_client.table('activity_logs').delete().lt(
                'created_at', 
                datetime.utcnow().isoformat()
            ).execute()
            cleaned_count = len(result.data) if result.data else 0
            
        logger.info(f"Cleanup completed: {cleaned_count} items removed")
        return {'success': True, 'cleaned_count': cleaned_count}
        
    except Exception as e:
        logger.error(f"Cleanup failed", error=str(e))
        raise

async def update_import_progress(user_id: str, import_id: str, progress: float):
    """Helper function to update import progress"""
    try:
        await supabase_client.table('import_jobs').update({
            'progress': progress,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', import_id).eq('user_id', user_id).execute()
        
    except Exception as e:
        logger.error(f"Failed to update import progress", error=str(e))