FROM node:18-alpine as builder

WORKDIR /app

RUN apk add chromium gcc
RUN npm i -g node-gyp

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN CXX=g++-12 npm install argon2
RUN npm install

COPY src src
COPY tsconfig.json tsconfig.json

RUN npm run build

#------------------------------------------------------------------------------

FROM node:18-alpine as app

WORKDIR /app
COPY --from=builder /app/dist dist

ENTRYPOINT node dist/server/index.cjs