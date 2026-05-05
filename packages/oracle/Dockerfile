# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace root manifests first (layer cache for deps)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy only the packages we need (sdk + oracle)
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/oracle/package.json packages/oracle/package.json

# Install all dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy source for sdk and oracle
COPY packages/sdk/ packages/sdk/
COPY packages/oracle/ packages/oracle/

# Build sdk first (oracle depends on it), then oracle
RUN pnpm --filter @eidolon/sdk build && \
    pnpm --filter @eidolon/oracle build

# ---- Stage 2: Runner ----
FROM node:20-alpine AS runner

LABEL org.opencontainers.image.title="eidolon-oracle" \
      org.opencontainers.image.description="Eidolon Oracle Service" \
      org.opencontainers.image.source="https://github.com/eidolon-project/eidolon"

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Create non-root user
RUN addgroup -S eidolon && adduser -S oracle -G eidolon

# Copy workspace root manifests
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Copy sdk package (built output + package.json)
COPY --from=builder /app/packages/sdk/package.json packages/sdk/package.json
COPY --from=builder /app/packages/sdk/dist/ packages/sdk/dist/

# Copy oracle package (source needed for tsx, plus built output)
COPY --from=builder /app/packages/oracle/ packages/oracle/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Switch to non-root user
USER oracle

# Document expected environment variables
ENV NODE_ENV=production \
    OG_NETWORK="" \
    OG_RPC_URL="" \
    DEPLOYER_PRIVATE_KEY="" \
    ORACLE_PRIVATE_KEY="" \
    SOUL_NFT_ADDRESS="" \
    MARKETPLACE_ADDRESS="" \
    ORACLE_REGISTRY_ADDRESS=""

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "process.exit(0)"

CMD ["pnpm", "--filter", "@eidolon/oracle", "start"]
