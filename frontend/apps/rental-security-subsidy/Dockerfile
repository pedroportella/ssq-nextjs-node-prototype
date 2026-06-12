FROM node:22-alpine AS builder

ENV NEXT_TELEMETRY_DISABLED=1
ENV SSQ_FRONTEND_DATA_SOURCE=mock
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
COPY frontend ./frontend

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ssq/rental-security-subsidy build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3002

WORKDIR /app

COPY --from=builder /app/frontend/apps/rental-security-subsidy/.next/standalone ./
COPY --from=builder /app/frontend/apps/rental-security-subsidy/.next/static ./frontend/apps/rental-security-subsidy/.next/static

EXPOSE 3002

CMD ["node", "frontend/apps/rental-security-subsidy/server.js"]
