import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const mode = process.argv[2] ?? "all";

const allowedEnvFiles = new Set([".env.example", ".env.local.example"]);

const generatedPathRules = [
  {
    label: "dependency directory",
    matches: (filePath) => filePath.split("/").includes("node_modules")
  },
  {
    label: "Next.js build output",
    matches: (filePath) => filePath.split("/").includes(".next")
  },
  {
    label: "backend/package build output",
    matches: (filePath) => filePath.split("/").includes("dist") || filePath.split("/").includes("build")
  },
  {
    label: "coverage output",
    matches: (filePath) => filePath.split("/").includes("coverage")
  },
  {
    label: "Playwright output",
    matches: (filePath) =>
      filePath.split("/").includes("playwright-report") || filePath.split("/").includes("test-results")
  },
  {
    label: "TypeScript build info",
    matches: (filePath) => filePath.endsWith(".tsbuildinfo")
  },
  {
    label: "local environment file",
    matches: (filePath) => {
      const fileName = filePath.split("/").at(-1);
      return fileName?.startsWith(".env") === true && !allowedEnvFiles.has(fileName);
    }
  },
  {
    label: "generated/local DigitalOcean spec",
    matches: (filePath) => /^\.do\/.*\.(generated|local)\.ya?ml$/.test(filePath)
  }
];

const browserLeakMarkers = [
  {
    label: "public backend URL env var",
    pattern: /NEXT_PUBLIC_BACKEND_URL/g
  },
  {
    label: "server-only backend URL env var",
    pattern: /BACKEND_INTERNAL_URL/g
  },
  {
    label: "Compose backend origin",
    pattern: /http:\/\/backend(?::\d+)?/g
  },
  {
    label: "local backend host",
    pattern: /localhost:7001/g
  },
  {
    label: "loopback backend host",
    pattern: /127\.0\.0\.1:7001/g
  },
  {
    label: "database URL",
    pattern: /postgres(?:ql)?:\/\//g
  }
];

function getTrackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" });
  return output.split("\0").filter(Boolean);
}

function walkFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...walkFiles(path));
      continue;
    }

    if (stats.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function findPatternMatches(filePath, markers) {
  const contents = readFileSync(filePath, "utf8");

  return markers.flatMap((marker) => {
    marker.pattern.lastIndex = 0;
    return marker.pattern.test(contents) ? [marker.label] : [];
  });
}

function checkTrackedArtifacts() {
  const trackedFiles = getTrackedFiles();
  const failures = [];

  for (const filePath of trackedFiles) {
    for (const rule of generatedPathRules) {
      if (rule.matches(filePath)) {
        failures.push(`${filePath} (${rule.label})`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("Tracked generated artifacts or local-only files were found:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Tracked artifact guard passed.");
}

function checkFrontendSourceConfig() {
  const trackedFrontendFiles = getTrackedFiles().filter((filePath) => filePath.startsWith("frontend/"));
  const failures = trackedFrontendFiles.filter((filePath) => {
    const contents = readFileSync(filePath, "utf8");
    return contents.includes("NEXT_PUBLIC_BACKEND_URL");
  });

  if (failures.length > 0) {
    console.error("Browser-visible backend env configuration was found in frontend source:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Frontend source endpoint guard passed.");
}

function checkBrowserBundles() {
  const staticRoots = [
    "frontend/apps/dashboard/.next/static",
    "frontend/apps/seniors-card/.next/static",
    "frontend/apps/rental-security-subsidy/.next/static"
  ];

  const missingRoots = staticRoots.filter((root) => !existsSync(root));
  if (missingRoots.length > 0) {
    console.error("Frontend browser bundle guard requires app builds before it runs. Missing:");
    for (const root of missingRoots) {
      console.error(`- ${root}`);
    }
    process.exitCode = 1;
    return;
  }

  const failures = [];

  for (const root of staticRoots) {
    for (const filePath of walkFiles(root)) {
      const matches = findPatternMatches(filePath, browserLeakMarkers);
      if (matches.length > 0) {
        failures.push(`${filePath} (${matches.join(", ")})`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("Browser bundle endpoint or secret markers were found:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Browser bundle endpoint guard passed.");
}

const checks = {
  artifacts: checkTrackedArtifacts,
  "frontend-source": checkFrontendSourceConfig,
  "browser-bundles": checkBrowserBundles,
  all: () => {
    checkTrackedArtifacts();
    if (process.exitCode) return;
    checkFrontendSourceConfig();
    if (process.exitCode) return;
    checkBrowserBundles();
  }
};

if (!checks[mode]) {
  console.error(`Unknown quality guard mode: ${mode}`);
  console.error(`Expected one of: ${Object.keys(checks).join(", ")}`);
  process.exit(1);
}

checks[mode]();
