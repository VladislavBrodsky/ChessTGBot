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

RUN npm run build

# ─── Stage 3: Minimal production image ──────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Only copy what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
