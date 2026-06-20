export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { getNodeAutoInstrumentations } = await import(
      '@opentelemetry/auto-instrumentations-node'
    )
    const { OTLPTraceExporter } = await import(
      '@opentelemetry/exporter-trace-otlp-proto'
    )
    const { OTLPMetricExporter } = await import(
      '@opentelemetry/exporter-metrics-otlp-proto'
    )
    const { PeriodicExportingMetricReader } = await import(
      '@opentelemetry/sdk-metrics'
    )

    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318'}/v1/traces',
      }),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318'}/v1/metrics',
        }),
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    })

    sdk.start()
  }
}
