# Lightweight production image for AstroSwap (optional; Vercel is preferred).
# Build: docker build -t astroswap .
# Run:   docker run --rm -p 3000:3000 \
#          -e NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=... \
#          -e NEXT_PUBLIC_ALCHEMY_KEY=... \
#          astroswap
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public NEXT_PUBLIC_* must be present at build time for client bundles.
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
ARG NEXT_PUBLIC_ALCHEMY_KEY=
ARG NEXT_PUBLIC_INFURA_KEY=
ARG NEXT_PUBLIC_RAILGUN_POI_NODE=
ARG NEXT_PUBLIC_RAILGUN_DEBUG=
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID \
    NEXT_PUBLIC_ALCHEMY_KEY=$NEXT_PUBLIC_ALCHEMY_KEY \
    NEXT_PUBLIC_INFURA_KEY=$NEXT_PUBLIC_INFURA_KEY \
    NEXT_PUBLIC_RAILGUN_POI_NODE=$NEXT_PUBLIC_RAILGUN_POI_NODE \
    NEXT_PUBLIC_RAILGUN_DEBUG=$NEXT_PUBLIC_RAILGUN_DEBUG
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
