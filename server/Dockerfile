FROM node:24-alpine AS base
WORKDIR /app

FROM base AS build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

FROM base AS development
COPY --from=build /app/node_modules/ ./node_modules/
COPY . .
CMD [ "npm", "run", "dev"]

FROM base AS production
# Copy package manifests from the build stage so npm can run in the final image
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
USER node
COPY --chown=node:node --from=build /app/dist ./dist
CMD [ "npm", "start"]
