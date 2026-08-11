from __future__ import annotations

from typing import Any

from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.metrics import Counter, Histogram, ObservableGauge, UpDownCounter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from config import settings
from logging import get_logger

logger = get_logger("telemetry")

_tracer: trace.Tracer | None = None
_meter: metrics.Meter | None = None


def init_telemetry() -> None:
    """Initialize OpenTelemetry SDK. Safe to call multiple times; no-op after first init."""
    global _tracer, _meter
    if _tracer is not None:
        return

    resource = Resource.create(
        {"service.name": settings.otel_service_name, "deployment.environment": settings.app_env}
    )

    if settings.otel_exporter_otlp_endpoint:
        tracer_provider = TracerProvider(resource=resource)
        tracer_provider.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=settings.otel_exporter_otlp_endpoint))
        )
        trace.set_tracer_provider(tracer_provider)
        _tracer = trace.get_tracer(settings.otel_service_name)
        logger.info("otlp_tracing_enabled", endpoint=settings.otel_exporter_otlp_endpoint)

        reader = PeriodicExportingMetricReader(
            OTLPMetricExporter(endpoint=settings.otel_exporter_otlp_endpoint)
        )
        meter_provider = MeterProvider(resource=resource, metric_readers=[reader])
        metrics.set_meter_provider(meter_provider)
        _meter = metrics.get_meter(settings.otel_service_name)
    else:
        _tracer = trace.get_tracer(settings.otel_service_name)
        _meter = metrics.get_meter(settings.otel_service_name)
        logger.info("otlp_disabled_using_noop")


def get_tracer() -> trace.Tracer:
    if _tracer is None:
        init_telemetry()
    assert _tracer is not None
    return _tracer


def histogram(name: str, description: str, unit: str = "1") -> Histogram:
    if _meter is None:
        init_telemetry()
    assert _meter is not None
    return _meter.create_histogram(name, description=description, unit=unit)


def counter(name: str, description: str) -> Counter:
    if _meter is None:
        init_telemetry()
    assert _meter is not None
    return _meter.create_counter(name, description=description)


class Gauge:
    def __init__(self, inner: UpDownCounter) -> None:
        self._inner = inner

    def set_to(self, value: float) -> None:
        self._inner.add(value)


def gauge(name: str, description: str) -> Gauge:
    if _meter is None:
        init_telemetry()
    assert _meter is not None
    return Gauge(_meter.create_up_down_counter(name, description=description))


def tracer() -> trace.Tracer:
    return get_tracer()
