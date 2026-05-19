FROM node:20-alpine AS builder

WORKDIR /app

# Copy package dependency definitions
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build Next.js
ENV STATIC_EXPORT=false
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose Next.js server port
EXPOSE 3000

CMD ["npm", "run", "start"]
