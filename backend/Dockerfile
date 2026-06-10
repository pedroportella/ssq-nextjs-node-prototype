FROM node:22-alpine AS backend

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

RUN pnpm install --filter @ssq/backend --frozen-lockfile

COPY backend ./backend

RUN pnpm --filter @ssq/backend build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=7001

EXPOSE 7001

CMD ["pnpm", "--dir", "backend", "start"]
