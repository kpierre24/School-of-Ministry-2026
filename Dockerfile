# ==============================================================================
# Stage 1: Build Application & Server
# ==============================================================================
FROM node:22-slim AS builder

WORKDIR /app

# Cache dependency installations
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source code (respects .dockerignore)
COPY . .

# Optional build-time arguments for frontend environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_STORAGE_BUCKET

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID} \
    VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY} \
    VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN} \
    VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}

# Build client SPA and bundle production server
RUN npm run build

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM node:22-slim AS runner

# Install git for repository synchronization
RUN apt-get update && apt-get install -y --no-install-recommends git curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Copy built distribution files and package manifests
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/package-lock.json* ./

# Install only production runtime dependencies
RUN (npm ci --omit=dev || npm install --omit=dev) && npm cache clean --force

# Adjust permissions for non-root node user
RUN chown -R node:node /app

# Switch to non-root security context
USER node

# Expose local and cloud container ports
EXPOSE 3000 8080

# Built-in container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', (r) => { if (r.statusCode !== 200) process.exit(1); })"

# Start unified production server
CMD ["node", "dist/server.cjs"]
