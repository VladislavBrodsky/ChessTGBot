# Build context is the REPO ROOT (the app imports design-system/website/theme.css).
# On Railway set RAILWAY_DOCKERFILE_PATH=website/Dockerfile and leave the service
# root directory unset.
FROM node:20-alpine AS deps
WORKDIR /app/website
COPY website/package.json website/package-lock.json ./
RUN npm ci --include=optional --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/website/node_modules ./website/node_modules
COPY design-system/website ./design-system/website
COPY website ./website
WORKDIR /app/website
ENV NEXT_TELEMETRY_DISABLED=1
# Railway variables need ARG declarations to reach the Next.js build stage.
ARG NEXT_PUBLIC_SITE_URL=https://web3chess.online
ARG NEXT_PUBLIC_APP_URL=https://app.web3chess.online
ARG NEXT_PUBLIC_BOT_USERNAME=chess_matbot
ARG NEXT_PUBLIC_TELEGRAM_CHANNEL=https://t.me/chess_hub
ARG NEXT_PUBLIC_TELEGRAM_CHAT=https://t.me/chesshub_chat
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
RUN npm run build

# Visitor-country database for the Google tag gateway (src/lib/geoip.ts).
# DB-IP "IP to Country Lite", CC BY 4.0 (https://db-ip.com), published monthly;
# each deploy picks up the current month, falling back to the previous one.
# A failed download must not block a deploy: the gateway then forwards no geo.
FROM alpine:3.20 AS geoip
RUN mkdir -p /geoip && cd /geoip && ( \
      for month in "$(date -u +%Y-%m)" "$(date -u -d "@$(( $(date -u +%s) - 2592000 ))" +%Y-%m)"; do \
        wget -q -O db.mmdb.gz "https://download.db-ip.com/free/dbip-country-lite-${month}.mmdb.gz" \
          && gunzip -f db.mmdb.gz && mv db.mmdb dbip-country-lite.mmdb && break; \
        rm -f db.mmdb.gz db.mmdb; \
      done; \
      ls -la /geoip \
    ) || echo "geoip download failed; analytics geo headers disabled"

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder /app/website/public ./website/public
COPY --from=builder /app/website/.next/standalone ./
COPY --from=builder /app/website/.next/static ./website/.next/static
COPY --from=geoip /geoip /app/geoip
ENV GEOIP_DB_PATH=/app/geoip/dbip-country-lite.mmdb
EXPOSE 3000
CMD ["node", "website/server.js"]
