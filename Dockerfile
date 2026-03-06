FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build --workspace=chatbot
RUN npm prune --production
EXPOSE 3000
CMD ["node", "server/index.js"]
