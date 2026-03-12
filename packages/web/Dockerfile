FROM node:22-slim AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile
COPY packages/web packages/web
RUN pnpm --filter web build

FROM nginx:alpine AS runtime
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
EXPOSE 80
