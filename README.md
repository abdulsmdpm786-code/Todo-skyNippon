# Todo App — Starter

Technical setup instructions. For the actual assignment brief (bugs to fix, tasks to complete, how to submit), see [ASSIGNMENT.md](ASSIGNMENT.md).

## Stack

- **Client**: React 18 + TypeScript + Vite + Tailwind CSS
- **Server**: Node + Express + TypeScript + Prisma + SQLite
- Two independent dev servers in one repo, run together via npm workspaces + `concurrently`

## Prerequisites

- Node.js 20+
- npm 10+

## Getting started

```bash
npm run setup   # installs both workspaces + runs the initial Prisma migration
npm run dev     # boots server (:4000) and client (:5173) together
```

Then open http://localhost:5173.

If you'd rather run them separately (e.g. in two terminals):

```bash
npm run dev -w server   # http://localhost:4000
npm run dev -w client   # http://localhost:5173
```

## Environment variables

- `server/.env` (copy from `server/.env.example`) — created automatically by `npm run setup`.
- `client/.env` (copy from `client/.env.example`) — only needed if you want to point the client at an API URL other than the default `http://localhost:4000/api`.

## Resetting sample data

```bash
npm run prisma:seed -w server
```

## Project structure

```
client/   React app (Vite)
server/   Express API (Prisma + SQLite)
```

See `server/src/routes/todos.ts` for the API and `client/src/` for the frontend. Both are small enough to read end to end before you start.
