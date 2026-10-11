# ─── Stage 1: Install dependencies ─────────────────────────────────────────
# This layer is only rebuilt when package.json / package-lock.json changes.
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package.json (and package-lock.json if it exists)
COPY package.json package-lock.json* ./

# Use npm install to resolve dependencies dynamically for the target OS
RUN npm install

# ─── Stage 2: Build the Next.js app ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Bring in node_modules from the deps stage (cached until lockfile changes)
COPY --from=deps /app/node_modules ./node_modules

# Copy all source (only src/config files, no node_modules or .next)
COPY . .

ENV STATIC_EXPORT=false
ENV NEXT_TELEMETRY_DISABLED=1

# Railway build variables must be declared in the stage that runs next build.
# Only public client settings and the backend URL are forwarded; no credentials.
ARG BACKEND_URL=https://api.web3chess.online
ARG NEXT_PUBLIC_API_URL=https://api.web3chess.online
ARG NEXT_PUBLIC_BOT_USERNAME=chess_matbot
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_E2E_TEST_MODE=false
ARG NEXT_PUBLIC_E2E_AUTO_AUTH=false

RUN npm run build

# ─── Stage 3: Minimal production image ──────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=8080

# Only copy what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/start-server.mjs ./start-server.mjs

EXPOSE 8080
EXPOSE 3000

CMD ["node", "start-server.mjs"]
