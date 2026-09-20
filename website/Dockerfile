# Build context is the REPO ROOT (the app imports design-system/website/theme.css).
# On Railway set RAILWAY_DOCKERFILE_PATH=website/Dockerfile and leave the service
# root directory unset.
FROM node:20-alpine AS deps
WORKDIR /app/website
COPY website/package.json ./
RUN npm install --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/website/node_modules ./website/node_modules
COPY design-system/website ./design-system/website
COPY website ./website
WORKDIR /app/website
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=builder /app/website/public ./website/public
COPY --from=builder /app/website/.next/standalone ./
COPY --from=builder /app/website/.next/static ./website/.next/static
EXPOSE 3000
CMD ["node", "website/server.js"]
