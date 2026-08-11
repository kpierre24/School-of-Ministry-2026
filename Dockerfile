FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/server.cjs"]

