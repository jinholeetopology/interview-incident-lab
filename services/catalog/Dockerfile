FROM node:22-slim
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/catalog ./services/catalog
RUN npm install --omit=dev --workspace @atlas/catalog --include-workspace-root=false || npm install
WORKDIR /workspace/services/catalog
CMD ["npx", "tsx", "src/index.ts"]
