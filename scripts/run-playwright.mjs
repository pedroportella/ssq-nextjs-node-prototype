#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function normalisePlaywrightColourEnv(sourceEnv) {
  const env = { ...sourceEnv };
  const requestedForcedColour = env.SSQ_PLAYWRIGHT_FORCE_COLOR;

  if (requestedForcedColour !== undefined) {
    delete env.NO_COLOR;
    env.FORCE_COLOR = requestedForcedColour;
    env.DEBUG_COLORS ??= requestedForcedColour === "0" || requestedForcedColour === "false" ? "0" : "1";
    return env;
  }

  if (env.NO_COLOR !== undefined) {
    delete env.NO_COLOR;
    env.FORCE_COLOR = "0";
    env.DEBUG_COLORS = "0";
  }

  return env;
}

const child = spawn(process.execPath, [require.resolve("@playwright/test/cli"), ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: normalisePlaywrightColourEnv(process.env),
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
