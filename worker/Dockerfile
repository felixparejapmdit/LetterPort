FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Configure npm network retries and install dependencies
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && (npm ci || npm install)

COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Prune devDependencies locally without making any new network requests
RUN npm prune --omit=dev

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache poppler-utils

COPY package*.json ./
# Copy pre-installed production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
