FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .editorconfig .gitignore ./
COPY apps ./apps
COPY packages ./packages
COPY sql ./sql
COPY docs ./docs

RUN pnpm install

CMD ["pnpm", "dev"]
