FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
RUN npm install \
    @opentelemetry/api@1.9.0 \
    @opentelemetry/auto-instrumentations-node@0.45.0 \
    @opentelemetry/exporter-trace-otlp-proto@0.54.0 \
    @opentelemetry/exporter-metrics-otlp-proto@0.54.0 \
    @opentelemetry/sdk-metrics@1.27.0 \
    @opentelemetry/sdk-node@0.54.0

COPY . .
RUN npm run build

FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/dashboard || exit 1

CMD ["node", "server.js"]
