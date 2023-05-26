# autobaan

Automatic court reservation!

## Setup

### Requirements

- Node.js (18.x)
- npm (8.x)
- nvm 
- Docker
- redis

#### Using nvm

1. Install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
1. `nvm use` will use version specified in `.nvmrc`
1. `nvm install-latest-npm` will upgrade NPM to latest version (8.x)

### Usage

```bash
npm install
npm start:dev
```

## Deployment

- Create a volume which will store the SQLite database file using docker-like
- Build image via provided dockerfile
- Run container with built image exposing port 3000 and mapping the aforementioned volume to /app/db

### CD

So I don't forget... I am using GHA to create a container image which I pull on my server using podman. This then restarts the container on my server with the latest image. The container is backed by a systemd service to restart and start on boot.
