import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const port = process.env.PORT || "3000";
const url = `http://127.0.0.1:${port}`;

function command(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

function waitForUrl(targetUrl) {
  const deadline = Date.now() + 30000;

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(targetUrl, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for ${targetUrl}`));
          return;
        }

        setTimeout(check, 350);
      });
    };

    check();
  });
}

async function main() {
  await access(path.join(root, "node_modules", ".bin", command("electron")));

  const next = spawn(command("npm"), ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", port], {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });

  await waitForUrl(url);

  const electron = spawn(command("electron"), ["."], {
    cwd: root,
    env: {
      ...process.env,
      FOCUSBOARD_DESKTOP: "1",
      FOCUSBOARD_DESKTOP_DEV_URL: url,
    },
    shell: false,
    stdio: "inherit",
  });

  electron.on("exit", (code) => {
    next.kill();
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
