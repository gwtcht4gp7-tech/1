import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const electronExe = path.join(process.cwd(), "node_modules", "electron", "dist", "electron.exe");

if (!existsSync(electronExe)) {
  const result = spawnSync(process.execPath, ["node_modules/electron/install.js"], {
    env: {
      ...process.env,
      ELECTRON_MIRROR: process.env.ELECTRON_MIRROR || "https://npmmirror.com/mirrors/electron/",
    },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
