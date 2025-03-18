FROM node:18-alpine

WORKDIR /app

# Install necessary tools
RUN apk add --no-cache bash supervisor

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Setup supervisord to manage multiple processes
COPY supervisord.conf /etc/supervisord.conf

# Expose the application port
EXPOSE 3000

# Start supervisord which will manage all processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]