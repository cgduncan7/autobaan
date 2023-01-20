FROM node:18

WORKDIR /app

RUN apt update
RUN apt install -y chromium gcc
RUN npm i -g node-gyp

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN CXX=g++-12 npm install argon2
RUN npm install

COPY src src
COPY tsconfig.json tsconfig.json

RUN npm run build
ENTRYPOINT node dist/server/index.js