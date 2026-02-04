FROM node:20-alpine

WORKDIR /app

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat

# Copy dependencies
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and .env
COPY . .
# Note: .env is copied here as requested
COPY .env ./

# Build the application
RUN npm run build

# Remove devDependencies step removed because next.config.ts requires typescript
# RUN npm prune --production

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Start the application
CMD ["npm", "start"]
