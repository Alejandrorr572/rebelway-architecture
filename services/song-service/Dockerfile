# Build context: monorepo root
# docker build -f services/song-service/Dockerfile .

# ---- Build stage: compile TypeScript ----
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/song-service/package.json services/song-service/

RUN npm ci --ignore-scripts

COPY services/song-service/tsconfig.json services/song-service/
COPY services/song-service/src services/song-service/src

RUN npm run build -w services/song-service

# ---- Production stage: compiled code + production dependencies only ----
FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/song-service/package.json services/song-service/

RUN npm ci --omit=dev --omit=optional --ignore-scripts -w services/song-service && npm cache clean --force

COPY --from=build /app/services/song-service/dist services/song-service/dist

WORKDIR /app/services/song-service

USER node

EXPOSE 4002

CMD ["node", "dist/app.js"]
