FROM node:18-alpine

WORKDIR /app

COPY ./common ./common
COPY ./server ./server

WORKDIR /app/server

RUN npm ci

CMD ["npm", "run", "start"]