FROM node:20-alpine

WORKDIR /app

# Copy package dependency definitions
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build Next.js
ENV STATIC_EXPORT=false
RUN npm run build

# Expose Next.js server port
EXPOSE 3000

CMD ["npm", "run", "start"]
