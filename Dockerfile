FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

RUN npm install -g pnpm@10.14.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY crates ./crates
COPY Cargo.toml Cargo.lock ./

RUN pnpm run build

RUN echo "=== Files in /app ===" && ls -la
RUN echo "=== Looking for .node files ===" && find . -name "*.node" -type f

FROM node:22-slim

WORKDIR /app

RUN npm install -g pnpm@10.14.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

COPY --from=builder /app ./temp-check
RUN find ./temp-check -name "*.node" -exec cp {} ./ \;
RUN rm -rf ./temp-check

RUN ln -s codemod-agent-native.linux-x64-gnu.node diff.node || true
RUN ln -s codemod-agent-native.linux-x64-gnu.node codemod-processor.node || true

RUN mkdir -p /app/keys

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "dist/index.js"]
