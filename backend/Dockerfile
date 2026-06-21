# Build stage with security scanning
ARG RUN_SECURITY_SCAN=false
FROM python:3.12-slim@sha256:d764629ce0ddd8c71fd371e9901efb324a95789d2315a47db7e4d27e78f1b0e9 AS builder

WORKDIR /app

COPY requirements.txt requirements.lock ./
RUN pip install --root-user-action=ignore --no-cache-dir --prefix=/install --require-hashes -r requirements.lock

# Optional security scan at build time
RUN if [ "$RUN_SECURITY_SCAN" = "true" ]; then \
    pip install --root-user-action=ignore --no-cache-dir pip-audit && \
    python -m pip_audit -r requirements.txt --format=json || exit 1; \
    fi

# Install OpenTelemetry auto-instrumentation packages
RUN pip install --root-user-action=ignore --no-cache-dir --prefix=/install \
    opentelemetry-distro \
    opentelemetry-exporter-otlp-proto-grpc

FROM python:3.12-slim@sha256:d764629ce0ddd8c71fd371e9901efb324a95789d2315a47db7e4d27e78f1b0e9

WORKDIR /app

RUN addgroup --system --gid 1001 appgroup \
 && adduser --system --uid 1001 --gid 1001 --home /app appuser

COPY --from=builder /install /usr/local
COPY --chown=appuser:appgroup . .

ENV PATH=/usr/local/bin:$PATH

# Bootstrap OTel instrumentations
RUN opentelemetry-bootstrap -a install

USER appuser

RUN chmod +x entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

ENTRYPOINT ["./entrypoint.sh"]