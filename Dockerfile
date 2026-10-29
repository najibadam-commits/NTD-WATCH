# syntax=docker/dockerfile:1
#
# NTD-WATCH demonstration prototype: static web app (React + Vite) served by nginx.
# Synthetic data only. Not a production deployment: no backend, no real authentication.
#
# This repository contains no Python code, so the image uses Node for the build and an
# unprivileged nginx for serving. The build output is the same as `npm run build`.

# ---- Stage 1: build ---------------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app

# Install dependencies first so this layer is cached until the manifests change.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/api-contract/package.json packages/api-contract/
COPY packages/demo-data/package.json packages/demo-data/
COPY packages/design-system/package.json packages/design-system/
COPY packages/domain/package.json packages/domain/
COPY packages/programme/package.json packages/programme/
COPY packages/rules-engine/package.json packages/rules-engine/
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- Stage 2: runtime -------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Unprivileged user. Nginx listens on 8080 (no privileged port) and keeps its pid file
# and temporary files under /tmp, so the container can run without root.
RUN addgroup -S appuser && adduser -S -G appuser -H -s /sbin/nologin appuser \
 && rm -rf /usr/share/nginx/html/* \
 && chown -R appuser:appuser /var/cache/nginx /var/log/nginx

COPY --chown=appuser:appuser docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=appuser:appuser /app/apps/web/dist /usr/share/nginx/html

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
