FROM node:22-slim AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json packages/api/
RUN pnpm install --frozen-lockfile
COPY packages/api packages/api
RUN pnpm --filter api build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/packages/api/dist ./
EXPOSE 3000
CMD ["node", "index.js"]
