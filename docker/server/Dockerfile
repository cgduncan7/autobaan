FROM node:18 as base
LABEL org.opencontainers.image.source https://github.com/cgduncan7/autobaan

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

RUN apt-get update \
    && apt-get install -y gcc chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends
RUN npm i -g node-gyp

WORKDIR /app
RUN chown -R node:node .

USER node

COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json

RUN CXX=g++-12 npm install --omit=dev

FROM node:18 as builder

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

RUN apt-get update \
    && apt-get install -y gcc chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends
RUN npm i -g node-gyp

WORKDIR /app
RUN chown -R node:node .

USER node

COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json
COPY --chown=node:node src src
COPY --chown=node:node tsconfig.json tsconfig.json

RUN CXX=g++-12 npm install
RUN npm run build

FROM base as app

COPY --chown=node:node --from=builder /app/dist ./dist

ENTRYPOINT ["node", "./dist/main.js"]