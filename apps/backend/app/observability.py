"""OpenTelemetry setup.

Default behaviour: traces are produced for every FastAPI request,
asyncpg query, and httpx call, with the trace_id and span_id injected
into stdlib log records. Spans are not exported anywhere unless the
OTEL_EXPORTER_OTLP_ENDPOINT env var is set, in which case they ship
to that collector via OTLP/HTTP. This keeps the default install
zero-config while letting production users wire it into Jaeger,
Tempo, SigNoz, Honeycomb, etc. with one env var.
"""

import logging
import os

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

LOG_FORMAT = (
    "%(asctime)s %(levelname)s "
    "[trace=%(otelTraceID)s span=%(otelSpanID)s] "
    "%(name)s - %(message)s"
)


def setup_tracing(app: FastAPI) -> None:
    """Tracing + auto-instrumentation. Safe to call at module import time."""
    resource = Resource.create({
        "service.name": os.environ.get("OTEL_SERVICE_NAME", "lumen-backend"),
        "service.version": os.environ.get("OTEL_SERVICE_VERSION", "0.1.0"),
    })

    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)

    if os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"):
        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))

    LoggingInstrumentor().instrument(set_logging_format=False)
    FastAPIInstrumentor.instrument_app(app)
    AsyncPGInstrumentor().instrument()
    HTTPXClientInstrumentor().instrument()


class _TraceFieldDefaulter(logging.Filter):
    """LoggingInstrumentor only sets otelTraceID/otelSpanID on records emitted
    inside an active span. The formatter would crash on logs outside one
    (startup, background tasks). This fills them with "0" so the format
    string never fails."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "otelTraceID"):
            record.otelTraceID = "0"
        if not hasattr(record, "otelSpanID"):
            record.otelSpanID = "0"
        return True


def setup_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    handler.addFilter(_TraceFieldDefaulter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True
