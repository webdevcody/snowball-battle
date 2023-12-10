FROM node:20-alpine

WORKDIR /app

COPY ./common ./common
COPY ./server ./server

WORKDIR /app/server

RUN npm ci
RUN npm run build

CMD ["node", "dist/index.js"]