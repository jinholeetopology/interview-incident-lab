FROM node:22-slim
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/inventory ./services/inventory
RUN npm install --omit=dev --workspace @atlas/inventory --include-workspace-root=false || npm install
WORKDIR /workspace/services/inventory
CMD ["npx", "tsx", "src/index.ts"]
