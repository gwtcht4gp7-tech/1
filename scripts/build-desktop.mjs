import { spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const command = process.execPath;
const cliPath = path.join(process.cwd(), "node_modules", "electron-builder", "out", "cli", "cli.js");

const child = spawn(command, [cliPath, ...args], {
  env: {
    ...process.env,
    ELECTRON_BUILDER_BINARIES_MIRROR:
      process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||
      "https://npmmirror.com/mirrors/electron-builder-binaries/",
  },
  shell: false,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
