# ==========================================
# Stage 1: Build Frontend (Next.js Static Export)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend dependency files
COPY frontend/package.json frontend/package-lock.json* frontend/yarn.lock* ./
# Install deps
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build static output (out folder)
RUN npm run build

# ==========================================
# Stage 2: Build Backend & Serve
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (if needed for python libs)
# RUN apt-get update && apt-get install -y gcc

# Configuration
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy Backend Requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/app ./app

# Copy Built Frontend Assets from Stage 1
COPY --from=frontend-builder /app/frontend/out ./static_frontend

# Expose Port
EXPOSE 8000

# Run Application
# Create a non-root user
RUN adduser --disabled-password --gecos "" appuser

# Change ownership of the app directory
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Run Application
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
