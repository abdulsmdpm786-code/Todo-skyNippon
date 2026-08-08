// Runs automatically after `npm install` (any workspace) and as part of
// `npm run setup`. Copies each workspace's .env.example to .env the first
// time, so `prisma migrate` etc. always have DATABASE_URL available without
// a manual step. Never overwrites an existing .env.
const fs = require("node:fs");
const path = require("node:path");

const workspaces = ["server", "client"];

for (const workspace of workspaces) {
  const example = path.join(__dirname, "..", workspace, ".env.example");
  const target = path.join(__dirname, "..", workspace, ".env");

  if (!fs.existsSync(example)) continue;
  if (fs.existsSync(target)) continue;

  fs.copyFileSync(example, target);
  console.log(`Created ${workspace}/.env from ${workspace}/.env.example`);
}
