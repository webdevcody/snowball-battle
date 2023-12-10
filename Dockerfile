FROM node:20-alpine as build

WORKDIR /app

COPY ./common ./common
COPY ./server ./server

WORKDIR /app/server

RUN npm ci
RUN npm run build

FROM node:20-alpine

WORKDIR /app/server

COPY --from=build /app/server/package*.json .

RUN npm install --only=production

COPY --from=build /app/server/.env .
COPY --from=build /app/server/dist dist

CMD ["node", "dist/index.js"]