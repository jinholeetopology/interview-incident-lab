FROM node:22-slim
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/payments ./services/payments
RUN npm install --omit=dev --workspace @atlas/payments --include-workspace-root=false || npm install
WORKDIR /workspace/services/payments
CMD ["npx", "tsx", "src/index.ts"]
