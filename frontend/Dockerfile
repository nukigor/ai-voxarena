# --- Build stage: install deps, build the Next app ---
FROM node:20-alpine AS builder
WORKDIR /app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# copy source
COPY . .

# ✅ generate Prisma client (must happen before build)
RUN npx prisma generate

# build Next.js app (standalone output)
RUN npm run build

# --- Runtime stage: minimal image to run the app ---
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# ✅ include Prisma schema & migrations if you ever run `npx prisma migrate deploy` inside container
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]