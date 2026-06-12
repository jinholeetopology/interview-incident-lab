FROM node:22-slim
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/orders ./services/orders
RUN npm install --omit=dev --workspace @atlas/orders --include-workspace-root=false || npm install
WORKDIR /workspace/services/orders
CMD ["npx", "tsx", "src/index.ts"]
