FROM node:18

RUN apt-get update \
    && apt-get install -y gcc chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends
RUN npm i -g node-gyp

USER node
WORKDIR /app

COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json
RUN CXX=g++-12 npm install argon2
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium
RUN npm install
RUN chown -R node:node .

COPY --chown=node:node src src
COPY --chown=node:node tsconfig.json tsconfig.json
RUN npm run build
ENTRYPOINT node dist/server/index.js