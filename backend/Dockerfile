FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Local uploads fallback (mounted as a volume in docker-compose)
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]
