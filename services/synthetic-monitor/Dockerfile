FROM node:22-slim

WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY services/synthetic-monitor/package.json ./services/synthetic-monitor/package.json
RUN npm install --package-lock=false

COPY packages/shared ./packages/shared
COPY db ./db
COPY scripts ./scripts
COPY services/synthetic-monitor ./services/synthetic-monitor

CMD ["npx", "tsx", "services/synthetic-monitor/src/index.ts"]
