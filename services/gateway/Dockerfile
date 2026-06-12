FROM node:22-slim
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/gateway ./services/gateway
RUN npm install --omit=dev --workspace @atlas/gateway --include-workspace-root=false || npm install
WORKDIR /workspace/services/gateway
CMD ["npx", "tsx", "src/index.ts"]
