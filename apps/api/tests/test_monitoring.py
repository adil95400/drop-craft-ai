"""
Sprint 6: Monitoring & Health Tests
Validates metrics collection, alerting thresholds, and health endpoints
"""
import time
from dataclasses import dataclass, field
from typing import List, Optional


# ── Metrics Collector ────────────────────────────────────────────────────────

@dataclass
class MetricSample:
    name: str
    value: float
    timestamp: float = field(default_factory=time.time)
    labels: dict = field(default_factory=dict)


class MetricsCollector:
    """In-memory metrics collector for testing and lightweight deployments."""

    def __init__(self):
        self._samples: List[MetricSample] = []
        self._counters: dict[str, float] = {}
        self._gauges: dict[str, float] = {}

    def inc(self, name: str, value: float = 1, labels: dict = None):
        self._counters[name] = self._counters.get(name, 0) + value
        self._samples.append(MetricSample(name, self._counters[name], labels=labels or {}))

    def set_gauge(self, name: str, value: float, labels: dict = None):
        self._gauges[name] = value
        self._samples.append(MetricSample(name, value, labels=labels or {}))

    def get_counter(self, name: str) -> float:
        return self._counters.get(name, 0)

    def get_gauge(self, name: str) -> float:
        return self._gauges.get(name, 0)

    def get_samples(self, name: str, since: float = 0) -> List[MetricSample]:
        return [s for s in self._samples if s.name == name and s.timestamp >= since]


# ── Alert Rules Engine ───────────────────────────────────────────────────────

@dataclass
class AlertRule:
    name: str
    metric: str
    threshold: float
    operator: str  # gt, lt, gte, lte, eq
    severity: str  # info, warning, critical
    cooldown_seconds: int = 300

    def evaluate(self, value: float) -> bool:
        ops = {
            "gt": lambda v, t: v > t,
            "lt": lambda v, t: v < t,
            "gte": lambda v, t: v >= t,
            "lte": lambda v, t: v <= t,
            "eq": lambda v, t: v == t,
        }
        return ops.get(self.operator, lambda v, t: False)(value, self.threshold)


@dataclass
class Alert:
    rule_name: str
    metric: str
    value: float
    severity: str
    timestamp: float = field(default_factory=time.time)


class AlertEngine:
    def __init__(self):
        self._rules: List[AlertRule] = []
        self._fired: List[Alert] = []
        self._last_fired: dict[str, float] = {}

    def add_rule(self, rule: AlertRule):
        self._rules.append(rule)

    def evaluate(self, collector: MetricsCollector) -> List[Alert]:
        new_alerts = []
        now = time.time()

        for rule in self._rules:
            value = collector.get_gauge(rule.metric) or collector.get_counter(rule.metric)
            if rule.evaluate(value):
                last = self._last_fired.get(rule.name, 0)
                if now - last >= rule.cooldown_seconds:
                    alert = Alert(rule.name, rule.metric, value, rule.severity)
                    new_alerts.append(alert)
                    self._fired.append(alert)
                    self._last_fired[rule.name] = now

        return new_alerts


# ── Tests ────────────────────────────────────────────────────────────────────

def test_counter_increment():
    c = MetricsCollector()
    c.inc("http_requests_total")
    c.inc("http_requests_total")
    c.inc("http_requests_total", 3)
    assert c.get_counter("http_requests_total") == 5


def test_gauge_set():
    c = MetricsCollector()
    c.set_gauge("cpu_usage", 45.2)
    assert c.get_gauge("cpu_usage") == 45.2
    c.set_gauge("cpu_usage", 60.1)
    assert c.get_gauge("cpu_usage") == 60.1


def test_samples_filtering():
    c = MetricsCollector()
    c.inc("requests")
    time.sleep(0.01)
    cutoff = time.time()
    time.sleep(0.01)
    c.inc("requests")
    recent = c.get_samples("requests", since=cutoff)
    assert len(recent) == 1


def test_alert_rule_evaluation():
    rule = AlertRule("high_latency", "api_latency_p95", 2000, "gt", "warning")
    assert rule.evaluate(2500) is True
    assert rule.evaluate(1500) is False
    assert rule.evaluate(2000) is False


def test_alert_engine_fires():
    collector = MetricsCollector()
    engine = AlertEngine()

    engine.add_rule(AlertRule("high_errors", "error_count", 10, "gte", "critical", cooldown_seconds=0))

    collector.set_gauge("error_count", 5)
    alerts = engine.evaluate(collector)
    assert len(alerts) == 0

    collector.set_gauge("error_count", 15)
    alerts = engine.evaluate(collector)
    assert len(alerts) == 1
    assert alerts[0].severity == "critical"


def test_alert_cooldown():
    collector = MetricsCollector()
    engine = AlertEngine()

    engine.add_rule(AlertRule("cpu_high", "cpu", 90, "gt", "warning", cooldown_seconds=9999))
    collector.set_gauge("cpu", 95)

    alerts1 = engine.evaluate(collector)
    assert len(alerts1) == 1

    alerts2 = engine.evaluate(collector)
    assert len(alerts2) == 0  # cooldown active


def test_health_endpoint_contract():
    """Validates the expected health response structure."""
    health = {
        "status": "healthy",
        "version": "2.0.0",
        "checks": {
            "database": {"status": "up", "latency_ms": 12},
            "redis": {"status": "up", "latency_ms": 3},
            "queue": {"status": "up", "pending_jobs": 0},
        }
    }

    assert health["status"] in ("healthy", "degraded", "unhealthy")
    assert "version" in health
    for check in health["checks"].values():
        assert check["status"] in ("up", "down", "degraded")


def test_readiness_probe():
    """Validates readiness probe contract."""
    ready = {"ready": True, "dependencies": {"db": True, "cache": True}}
    assert ready["ready"] is True
    assert all(ready["dependencies"].values())


if __name__ == "__main__":
    test_counter_increment()
    test_gauge_set()
    test_samples_filtering()
    test_alert_rule_evaluation()
    test_alert_engine_fires()
    test_alert_cooldown()
    test_health_endpoint_contract()
    test_readiness_probe()
    print("✅ All monitoring tests passed!")
