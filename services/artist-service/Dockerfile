# Build context: monorepo root
# docker build -f services/artist-service/Dockerfile .

# ---- Build stage: compile TypeScript ----
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/artist-service/package.json services/artist-service/

RUN npm ci --ignore-scripts

COPY services/artist-service/tsconfig.json services/artist-service/
COPY services/artist-service/src services/artist-service/src

RUN npm run build -w services/artist-service

# ---- Production stage: compiled code + production dependencies only ----
FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/artist-service/package.json services/artist-service/

RUN npm ci --omit=dev --omit=optional --ignore-scripts -w services/artist-service && npm cache clean --force

COPY --from=build /app/services/artist-service/dist services/artist-service/dist

WORKDIR /app/services/artist-service

USER node

EXPOSE 4001

CMD ["node", "dist/app.js"]
