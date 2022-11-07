# autobaan

Automatic court reservation!

## Setup

### Requirements

- Node.js (18.x)
- npm (8.x)
- gcc (g++-12)
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

## Architecture

```
|======|
| User |
|======|
    |
[requests reservation]
    |
    |
    V
|===========|                             /---\                           |==========|
| Scheduler | ---[checks possibility]--->/ ok? \--[y/ forward request]--> | Reserver |
|===========|                            \     /                          |==========|
                                          \---/                                 |
                                            |                                   |
                                          [n/ save request]      [find possible, saved reservations]
                                            |                                   |
                                            V                                   |
                                        |==========|                            |
                                        | Database |<---------------------------|
                                        |==========|
```