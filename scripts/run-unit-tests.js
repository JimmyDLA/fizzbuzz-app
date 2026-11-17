const { spawnSync } = require("child_process");
const { readdirSync, statSync } = require("fs");
const path = require("path");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".expo",
  "ios",
  "android",
  "web-build",
]);

function collectTests(dir, found) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) {
      if (!SKIP_DIRS.has(name)) collectTests(full, found);
      continue;
    }
    if (name.endsWith(".test.ts")) found.push(full);
  }
  return found;
}

const files = collectTests(process.cwd(), []).sort();
if (files.length === 0) {
  console.error("No *.test.ts files found");
  process.exit(1);
}

const tsxBin = path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);

for (const file of files) {
  const result = spawnSync(tsxBin, [file], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status == null ? 1 : result.status);
  }
}
