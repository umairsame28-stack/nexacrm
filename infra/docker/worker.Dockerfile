# Inherits from the api image — same code, different entrypoint
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/
RUN npm ci --workspace=apps/api --workspace=packages/config --workspace=packages/shared-types
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/
RUN cd apps/api && npx prisma generate
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S worker -u 1001

WORKDIR /app
COPY --from=builder --chown=worker:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/apps/api/package.json ./package.json
COPY --from=builder --chown=worker:nodejs /app/apps/api/prisma ./prisma

ENV NODE_ENV=production
USER worker

# Workers use the same main.ts — queue processors register themselves via decorators
CMD ["node", "dist/main"]
