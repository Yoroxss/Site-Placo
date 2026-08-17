# Multi-stage Dockerfile for Google Cloud Run / Docker deployment

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install all dependencies (including devDependencies required for build)
RUN npm install

# Copy full application source code
COPY . .

# Build Vite client and bundled server to dist/
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency definition files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built bundle from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (Cloud Run sets process.env.PORT automatically)
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
