FROM node:22-slim

WORKDIR /app

RUN npm install -g pnpm
COPY pnpm-lock.yaml package.json ./
RUN pnpm install

COPY . .

CMD ["pnpm", "start"]
