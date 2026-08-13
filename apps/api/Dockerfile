FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @medicerca/api build
FROM node:22-alpine
WORKDIR /app/apps/api
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
EXPOSE 4000
CMD ["node", "dist/main.js"]
