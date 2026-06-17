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

const australianEnglishRules = [
  {
    label: "artifact",
    pattern: /\bartifacts?\b/i,
    preferred: "artefact/artefacts",
    allowedLinePatterns: [/\bguard:artifacts\b/, /\bartifacts:\s*checkTrackedArtifacts\b/, /quality-guards\.mjs artifacts/]
  },
  {
    label: "authorization",
    pattern: /\b(authori(?:zation|ze|zes|zed|zing)|unauthorized)\b/i,
    preferred: "authorisation/authorise/authorised/unauthorised",
    allowedLinePatterns: [
      /\bAuthorizationPolicyService\b/,
      /\bcontext\.authorization\b/,
      /\bauthorization\s*[=:.()]/,
      /\bheaders\.authorization\b/,
      /\brequest\.headers\.authorization\b/,
      /\breq\.headers\.authorization\b/,
      /\bheaders\[['"]authorization['"]\]/,
      /['"]authorization['"]/
    ]
  },
  {
    label: "behavior",
    pattern: /\bbehaviors?\b/i,
    preferred: "behaviour/behaviours",
    allowedLinePatterns: []
  },
  {
    label: "color",
    pattern: /\bcolors?\b/i,
    preferred: "colour/colours",
    allowedLinePatterns: [/--[A-Za-z0-9_-]*color/i, /\bcolor\s*:/i]
  },
  {
    label: "center",
    pattern: /\bcenters?|centered|centering\b/i,
    preferred: "centre/centres/centred/centring",
    allowedLinePatterns: []
  },
  {
    label: "centralized",
    pattern: /\bcentraliz(?:e|es|ed|ing|ation)\b/i,
    preferred: "centralise/centralises/centralised/centralising/centralisation",
    allowedLinePatterns: []
  },
  {
    label: "organized",
    pattern: /\borganiz(?:e|es|ed|ing|ation|ations)\b/i,
    preferred: "organise/organises/organised/organising/organisation/organisations",
    allowedLinePatterns: []
  },
  {
    label: "labeled",
    pattern: /\blabel(?:ed|ing)\b/i,
    preferred: "labelled/labelling",
    allowedLinePatterns: []
  },
  {
    label: "modeling",
    pattern: /\bmodeling\b/i,
    preferred: "modelling",
    allowedLinePatterns: []
  },
  {
    label: "analyze",
    pattern: /\banalyz(?:e|es|ed|ing)\b/i,
    preferred: "analyse/analyses/analysed/analysing",
    allowedLinePatterns: []
  },
  {
    label: "license",
    pattern: /\blicens(?:e|es|ed|ing)\b/i,
    preferred: "licence/licences/licensed/licensing, unless referring to a code licence identifier",
    allowedLinePatterns: [/\bMIT\b/, /\bSPDX\b/, /\bLICENSE\b/]
  },
  {
    label: "fulfillment",
    pattern: /\bfulfill(?:s|ed|ing|ment)?\b/i,
    preferred: "fulfil/fulfils/fulfilled/fulfilling/fulfilment",
    allowedLinePatterns: []
  },
  {
    label: "enrollment",
    pattern: /\benroll(?:s|ed|ing|ment|ments)?\b/i,
    preferred: "enrol/enrols/enrolled/enrolling/enrolment/enrolments",
    allowedLinePatterns: []
  }
];

function isTerminologyScanFile(filePath) {
  if (filePath === "README.md" || filePath === "AGENTS.md" || filePath === "backend/README.md") {
    return true;
  }

  if (filePath.startsWith("docs/") && filePath.endsWith(".md")) {
    return true;
  }

  if (filePath === "scripts/quality-guards.mjs") {
    return true;
  }

  if (
    filePath === "backend/src/services/evidenceStorageService.ts" ||
    filePath === "backend/src/services/submissionSummaryService.ts" ||
    filePath === "frontend/packages/services/src/server/mockData/index.ts"
  ) {
    return true;
  }

  return (
    filePath.startsWith("frontend/apps/") &&
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) &&
    !filePath.endsWith("next-env.d.ts")
  );
}

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
    console.error("Tracked generated artefacts or local-only files were found:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Tracked artefact guard passed.");
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

function checkAustralianEnglishTerminology() {
  const trackedFiles = getTrackedFiles().filter(isTerminologyScanFile);
  const failures = [];

  for (const filePath of trackedFiles) {
    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      if (filePath === "scripts/quality-guards.mjs" && index + 1 >= 75 && index + 1 <= 163) {
        return;
      }

      for (const rule of australianEnglishRules) {
        if (!rule.pattern.test(line)) {
          continue;
        }

        if (rule.allowedLinePatterns.some((pattern) => pattern.test(line))) {
          continue;
        }

        failures.push(`${filePath}:${index + 1} uses ${rule.label}; prefer ${rule.preferred}`);
      }
    });
  }

  if (failures.length > 0) {
    console.error("Australian English terminology guard found US spelling in public prose or user-facing strings:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Australian English terminology guard passed.");
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
  terminology: checkAustralianEnglishTerminology,
  "frontend-source": checkFrontendSourceConfig,
  "browser-bundles": checkBrowserBundles,
  all: () => {
    checkTrackedArtifacts();
    if (process.exitCode) return;
    checkAustralianEnglishTerminology();
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
