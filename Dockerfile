FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY chatbot/package.json chatbot/
COPY dashboard/package.json dashboard/
COPY server/package.json server/
RUN npm ci
COPY . .
RUN npm run build --workspace=chatbot
RUN npm run build --workspace=dashboard

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY server/package.json server/
RUN npm ci --omit=dev --workspace=server
COPY server/ server/
COPY --from=builder /app/chatbot/dist chatbot/dist
COPY --from=builder /app/dashboard/dist dashboard/dist
EXPOSE 3000
USER node
CMD ["node", "server/index.js"]
