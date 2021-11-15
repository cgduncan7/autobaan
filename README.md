# autobaan

Automatic court reservation!

## Setup

### Requirements

- Node.js (14.x)
- npm (8.x)
- nvm (optional)

#### Using nvm

1. Install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
1. `nvm use` will use version specified in `.nvmrc`
1. `nvm install-latest-npm` will upgrade NPM to latest version (8.x)

### Usage

```bash
npm install
npm run local <username> <password> <year> <month> <day> <startTime> <endTime> <opponentName> <opponentId>
```