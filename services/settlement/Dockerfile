FROM node:22-slim
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/settlement ./services/settlement
RUN npm install --omit=dev --workspace @atlas/settlement --include-workspace-root=false || npm install
WORKDIR /workspace/services/settlement
CMD ["npx", "tsx", "src/index.ts"]
