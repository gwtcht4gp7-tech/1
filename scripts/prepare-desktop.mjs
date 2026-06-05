import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

async function copyIntoStandalone(source, target) {
  await rm(target, { force: true, recursive: true });
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });
}

await copyIntoStandalone(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static"),
);
await copyIntoStandalone(path.join(root, "public"), path.join(standaloneDir, "public"));
await copyIntoStandalone(path.join(root, "prisma"), path.join(standaloneDir, "prisma"));

console.log("Desktop standalone assets prepared.");
