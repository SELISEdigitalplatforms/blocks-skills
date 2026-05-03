# Build the Next.js application
FROM node:21.7.0-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG ci_build

RUN mkdir -p /app/log

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build:${ci_build}

# Stage 2: Serve with standalone Node.js server
FROM node:21.7.0-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "server.js"]
