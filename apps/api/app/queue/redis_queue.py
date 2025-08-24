import json
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Callable
from enum import Enum
import redis.asyncio as redis
from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)

class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"

class TaskPriority(int, Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4

class QueueTask(BaseModel):
    id: str
    name: str
    payload: Dict[str, Any]
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.NORMAL
    created_at: datetime
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0
    max_retries: int = 3
    error_message: Optional[str] = None
    user_id: Optional[str] = None

class RedisQueue:
    def __init__(self, redis_url: str = "redis://localhost:6379", db: int = 0):
        self.redis_pool = redis.ConnectionPool.from_url(redis_url, db=db)
        self.redis_client = redis.Redis(connection_pool=self.redis_pool)
        self.task_handlers: Dict[str, Callable] = {}
        self.is_running = False
        
    async def connect(self):
        """Initialize Redis connection"""
        try:
            await self.redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            raise

    async def disconnect(self):
        """Close Redis connection"""
        await self.redis_client.close()
        logger.info("Redis connection closed")

    def register_handler(self, task_name: str, handler: Callable):
        """Register a task handler function"""
        self.task_handlers[task_name] = handler
        logger.info(f"Registered handler for task: {task_name}")

    async def enqueue(
        self,
        task_name: str,
        payload: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        delay: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> str:
        """Add a task to the queue"""
        task_id = str(uuid.uuid4())
        scheduled_at = datetime.utcnow()
        
        if delay:
            scheduled_at += timedelta(seconds=delay)
            
        task = QueueTask(
            id=task_id,
            name=task_name,
            payload=payload,
            priority=priority,
            created_at=datetime.utcnow(),
            scheduled_at=scheduled_at,
            user_id=user_id
        )
        
        # Store task details
        await self.redis_client.hset(
            f"task:{task_id}",
            mapping={
                "data": task.model_dump_json(),
                "status": TaskStatus.PENDING
            }
        )
        
        # Add to priority queue
        queue_name = f"queue:{priority.name.lower()}"
        score = scheduled_at.timestamp()
        
        await self.redis_client.zadd(queue_name, {task_id: score})
        
        # Add to user tasks if user_id provided
        if user_id:
            await self.redis_client.sadd(f"user_tasks:{user_id}", task_id)
            
        logger.info(f"Enqueued task {task_id} ({task_name}) with priority {priority.name}")
        return task_id

    async def dequeue(self) -> Optional[QueueTask]:
        """Get the next task from the queue"""
        current_time = datetime.utcnow().timestamp()
        
        # Check queues in priority order
        for priority in [TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.NORMAL, TaskPriority.LOW]:
            queue_name = f"queue:{priority.name.lower()}"
            
            # Get tasks scheduled for now or earlier
            tasks = await self.redis_client.zrangebyscore(
                queue_name, 0, current_time, start=0, num=1, withscores=True
            )
            
            if tasks:
                task_id, score = tasks[0]
                task_id = task_id.decode('utf-8')
                
                # Remove from queue
                await self.redis_client.zrem(queue_name, task_id)
                
                # Get task details
                task_data = await self.redis_client.hget(f"task:{task_id}", "data")
                if task_data:
                    task = QueueTask.model_validate_json(task_data)
                    task.status = TaskStatus.PROCESSING
                    task.started_at = datetime.utcnow()
                    
                    # Update task status
                    await self.redis_client.hset(
                        f"task:{task_id}",
                        mapping={
                            "data": task.model_dump_json(),
                            "status": TaskStatus.PROCESSING
                        }
                    )
                    
                    return task
                    
        return None

    async def process_task(self, task: QueueTask) -> bool:
        """Process a single task"""
        try:
            handler = self.task_handlers.get(task.name)
            if not handler:
                raise ValueError(f"No handler registered for task: {task.name}")
                
            logger.info(f"Processing task {task.id} ({task.name})")
            
            # Execute task handler
            if asyncio.iscoroutinefunction(handler):
                result = await handler(task.payload)
            else:
                result = handler(task.payload)
                
            # Mark as completed
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.utcnow()
            
            await self.redis_client.hset(
                f"task:{task.id}",
                mapping={
                    "data": task.model_dump_json(),
                    "status": TaskStatus.COMPLETED,
                    "result": json.dumps(result) if result else ""
                }
            )
            
            logger.info(f"Task {task.id} completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Task {task.id} failed", error=str(e))
            await self.handle_task_failure(task, str(e))
            return False

    async def handle_task_failure(self, task: QueueTask, error_message: str):
        """Handle task failure with retry logic"""
        task.retry_count += 1
        task.error_message = error_message
        
        if task.retry_count <= task.max_retries:
            # Retry with exponential backoff
            delay = min(300, 2 ** task.retry_count * 10)  # Max 5 minutes
            task.status = TaskStatus.RETRYING
            task.scheduled_at = datetime.utcnow() + timedelta(seconds=delay)
            
            # Re-enqueue for retry
            queue_name = f"queue:{task.priority.name.lower()}"
            score = task.scheduled_at.timestamp()
            await self.redis_client.zadd(queue_name, {task.id: score})
            
            logger.info(f"Task {task.id} scheduled for retry {task.retry_count}/{task.max_retries} in {delay}s")
        else:
            # Mark as permanently failed
            task.status = TaskStatus.FAILED
            logger.error(f"Task {task.id} permanently failed after {task.retry_count} retries")
            
        # Update task status
        await self.redis_client.hset(
            f"task:{task.id}",
            mapping={
                "data": task.model_dump_json(),
                "status": task.status
            }
        )

    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status and details"""
        task_data = await self.redis_client.hgetall(f"task:{task_id}")
        if task_data:
            return {
                key.decode('utf-8'): value.decode('utf-8')
                for key, value in task_data.items()
            }
        return None

    async def get_user_tasks(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all tasks for a specific user"""
        task_ids = await self.redis_client.smembers(f"user_tasks:{user_id}")
        tasks = []
        
        for task_id in task_ids:
            task_id = task_id.decode('utf-8')
            task_status = await self.get_task_status(task_id)
            if task_status:
                tasks.append(task_status)
                
        return tasks

    async def get_queue_stats(self) -> Dict[str, int]:
        """Get queue statistics"""
        stats = {}
        
        for priority in TaskPriority:
            queue_name = f"queue:{priority.name.lower()}"
            count = await self.redis_client.zcard(queue_name)
            stats[f"{priority.name.lower()}_queue"] = count
            
        return stats

    async def start_worker(self, worker_name: str = "default"):
        """Start processing tasks from the queue"""
        self.is_running = True
        logger.info(f"Starting queue worker: {worker_name}")
        
        while self.is_running:
            try:
                task = await self.dequeue()
                if task:
                    await self.process_task(task)
                else:
                    # No tasks available, wait a bit
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Worker {worker_name} error", error=str(e))
                await asyncio.sleep(5)  # Backoff on error

    def stop_worker(self):
        """Stop the worker"""
        self.is_running = False
        logger.info("Queue worker stopping")

    async def cleanup_completed_tasks(self, older_than_hours: int = 24):
        """Clean up old completed/failed tasks"""
        cutoff_time = datetime.utcnow() - timedelta(hours=older_than_hours)
        cutoff_timestamp = cutoff_time.timestamp()
        
        # This would need additional implementation to track task completion times
        logger.info(f"Cleaning up tasks older than {older_than_hours} hours")