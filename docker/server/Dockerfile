FROM node:18 as app

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

RUN CXX=g++-12 npm install

COPY --chown=node:node data-source.ts data-source.ts
COPY --chown=node:node tsconfig.json tsconfig.json
COPY --chown=node:node tsconfig.build.json tsconfig.build.json 
COPY --chown=node:node database database
COPY --chown=node:node src src

RUN npm run migrations

ARG GIT_COMMIT

ENV GIT_COMMIT ${GIT_COMMIT:-unknown}

ENTRYPOINT ["npm", "run", "start"]