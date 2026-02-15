"""
Sprint 2 — Celery & Redis worker tests
Tests: error classification, backoff, ResilientTask, RedisQueue, celery config.
"""

import pytest
from unittest.mock import MagicMock, patch, PropertyMock
import json


# ── Error Recovery Tests ─────────────────────────────────────────────────────

class TestErrorClassification:
    def test_transient_errors(self):
        from app.core.error_recovery import classify_error
        assert classify_error(ConnectionError("refused")) == "transient"
        assert classify_error(TimeoutError("timed out")) == "transient"
        assert classify_error(OSError("broken pipe")) == "transient"

    def test_permanent_errors(self):
        from app.core.error_recovery import classify_error
        assert classify_error(ValueError("bad value")) == "permanent"
        assert classify_error(TypeError("wrong type")) == "permanent"
        assert classify_error(KeyError("missing")) == "permanent"

    def test_rate_limit_by_message(self):
        from app.core.error_recovery import classify_error
        assert classify_error(Exception("429 Too Many Requests")) == "rate_limited"
        assert classify_error(Exception("rate limit exceeded")) == "rate_limited"

    def test_unknown_defaults_transient(self):
        from app.core.error_recovery import classify_error

        class CustomError(Exception):
            pass

        assert classify_error(CustomError("something")) == "transient"


class TestExponentialBackoff:
    def test_increases_with_retries(self):
        from app.core.error_recovery import exponential_backoff
        d0 = exponential_backoff(0, base_delay=10, max_delay=1000)
        d1 = exponential_backoff(1, base_delay=10, max_delay=1000)
        d2 = exponential_backoff(2, base_delay=10, max_delay=1000)
        # Base values: 10, 20, 40 (+ jitter up to 30%)
        assert d0 >= 10
        assert d1 >= 20
        assert d2 >= 40

    def test_respects_max_delay(self):
        from app.core.error_recovery import exponential_backoff
        delay = exponential_backoff(100, base_delay=30, max_delay=600)
        assert delay <= 600 * 1.3 + 1  # max + jitter

    def test_rate_limit_backoff_longer(self):
        from app.core.error_recovery import exponential_backoff, rate_limit_backoff
        normal = exponential_backoff(0)
        rate = rate_limit_backoff(0)
        assert rate >= normal


# ── Celery Config Tests ──────────────────────────────────────────────────────

class TestCeleryConfig:
    def test_serializer_is_json(self):
        from app.queue.celery_app import celery_app
        assert celery_app.conf.task_serializer == "json"
        assert "json" in celery_app.conf.accept_content
        assert "pickle" not in celery_app.conf.accept_content

    def test_acks_late_enabled(self):
        from app.queue.celery_app import celery_app
        assert celery_app.conf.task_acks_late is True
        assert celery_app.conf.task_reject_on_worker_lost is True

    def test_worker_memory_limits(self):
        from app.queue.celery_app import celery_app
        assert celery_app.conf.worker_max_tasks_per_child == 200
        assert celery_app.conf.worker_max_memory_per_child == 512_000

    def test_broker_retry_on_startup(self):
        from app.queue.celery_app import celery_app
        assert celery_app.conf.broker_connection_retry_on_startup is True

    def test_beat_schedule_has_required_tasks(self):
        from app.queue.celery_app import celery_app
        schedule = celery_app.conf.beat_schedule
        assert "sync-supplier-stock-hourly" in schedule
        assert "cleanup-old-jobs-daily" in schedule
        assert "process-pending-orders" in schedule

    def test_task_routing(self):
        from app.queue.celery_app import celery_app
        routes = celery_app.conf.task_routes
        assert "app.queue.tasks.sync_*" in routes
        assert "app.queue.tasks.import_*" in routes
        assert routes["app.queue.tasks.ai_*"]["queue"] == "ai"


# ── RedisQueue Tests ─────────────────────────────────────────────────────────

class TestRedisQueue:
    def _make_queue(self):
        from app.queue.redis_queue import RedisQueue
        rq = RedisQueue.__new__(RedisQueue)
        rq.redis_url = "redis://localhost:6379/0"
        rq._pool = None
        rq._client = MagicMock()
        return rq

    def test_health_check_healthy(self):
        rq = self._make_queue()
        rq._client.ping.return_value = True
        rq._client.info.side_effect = [
            {"used_memory": 10_485_760},  # memory
            {"connected_clients": 5},      # clients
        ]
        result = rq.health_check()
        assert result["status"] == "healthy"

    def test_health_check_unhealthy(self):
        rq = self._make_queue()
        rq._client.ping.side_effect = ConnectionError("refused")
        result = rq.health_check()
        assert result["status"] == "unhealthy"

    def test_rate_limit_check(self):
        rq = self._make_queue()
        rq._client.get.return_value = "50"
        assert rq.check_rate_limit("key", 100) is True
        assert rq.check_rate_limit("key", 50) is False

    def test_cache_roundtrip(self):
        rq = self._make_queue()
        rq.cache_set("test_key", {"a": 1}, 60)
        rq._client.setex.assert_called_once()

        rq._client.get.return_value = json.dumps({"a": 1})
        result = rq.cache_get("test_key")
        assert result == {"a": 1}

    def test_distributed_lock(self):
        rq = self._make_queue()
        rq._client.set.return_value = True
        assert rq.acquire_lock("my_lock", 300) is True

        rq._client.exists.return_value = 1
        assert rq.is_locked("my_lock") is True

        rq.release_lock("my_lock")
        rq._client.delete.assert_called_with("lock:my_lock")

    def test_job_progress(self):
        rq = self._make_queue()
        rq.set_job_progress("job-1", 50, message="halfway", total=100)
        rq._client.setex.assert_called_once()

    def test_close_disconnects_pool(self):
        rq = self._make_queue()
        rq._pool = MagicMock()
        rq.close()
        rq._pool.disconnect.assert_called_once()
        assert rq._client is None


# ── Task Helper Tests ─────────────────────────────────────────────────────────

class TestTaskHelpers:
    def test_run_async_returns_value(self):
        from app.queue.tasks import run_async

        async def add(a, b):
            return a + b

        assert run_async(add(2, 3)) == 5

    def test_upsert_job_calls_supabase(self):
        from app.queue.tasks import _upsert_job
        mock_sb = MagicMock()
        _upsert_job(mock_sb, "job-1", "user-1", "import", job_subtype="csv")
        mock_sb.table.assert_called_with("jobs")
        mock_sb.table().upsert.assert_called_once()

    def test_fail_job_truncates_message(self):
        from app.queue.tasks import _fail_job
        mock_sb = MagicMock()
        long_msg = "x" * 5000
        _fail_job(mock_sb, "job-1", long_msg)
        call_args = mock_sb.table().update.call_args[0][0]
        assert len(call_args["error_message"]) <= 2000
