#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const trackedFileSet = new Set(trackedFiles);

const requiredFiles = [
  "README.md",
  "docs/selection-criteria-map.md",
  "docs/live-review-links.md",
  "docs/release-runbook.md",
  "docs/api-and-security-evidence.md",
  "docs/operational-reliability-support-evidence.md",
  "docs/aws-platform-mapping.md",
  "docs/accessibility-and-design-system-evidence.md",
  "docs/screenshots/ssq-dashboard.png",
  "docs/screenshots/ssq-seniors-card.png",
  "docs/screenshots/ssq-seniors-card-apply.png",
  "docs/screenshots/ssq-rental-security-subsidy.png"
];

const publicMarkdownFiles = trackedFiles.filter(
  (filePath) => filePath === "README.md" || (filePath.startsWith("docs/") && filePath.endsWith(".md"))
);

const publicFrontendUrls = [
  "https://ssq-dashboard-swgsm.ondigitalocean.app",
  "https://ssq-seniors-card-lfzpt.ondigitalocean.app",
  "https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app"
];

const statusUrls = publicFrontendUrls.map((url) => `${url}/status`);

const requiredText = [
  {
    filePath: "README.md",
    includes: [
      "docs/selection-criteria-map.md",
      "docs/live-review-links.md",
      "docs/api-and-security-evidence.md",
      "docs/operational-reliability-support-evidence.md",
      "docs/aws-platform-mapping.md",
      "docs/accessibility-and-design-system-evidence.md",
      "docs/release-runbook.md"
    ]
  },
  {
    filePath: "docs/selection-criteria-map.md",
    includes: [
      "api-and-security-evidence.md",
      "operational-reliability-support-evidence.md",
      "aws-platform-mapping.md",
      "accessibility-and-design-system-evidence.md",
      "release-runbook.md"
    ]
  },
  {
    filePath: "docs/live-review-links.md",
    includes: [...publicFrontendUrls, ...statusUrls]
  },
  {
    filePath: "docs/release-runbook.md",
    includes: [...publicFrontendUrls, ...statusUrls, "pnpm test:reviewer-evidence"]
  }
];

const forbiddenPublicDocPatterns = [
  {
    label: "private ai-notes path",
    pattern: /ai-notes\//
  },
  {
    label: "private delivery stage label",
    pattern: /\b[FBI]\d{2}\b/
  },
  {
    label: "merge conflict marker",
    pattern: /^(<<<<<<<|=======|>>>>>>>)$/m
  },
  {
    label: "real backend DigitalOcean host",
    pattern: /https:\/\/ssq-node-api-(?!xxxxx)[a-z0-9-]+\.ondigitalocean\.app/i
  },
  {
    label: "AWS access key",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/
  },
  {
    label: "literal AWS account ARN",
    pattern: /arn:aws:iam::\d{12}:/
  },
  {
    label: "generated DigitalOcean spec path",
    pattern: /\.do\/(?!\*)[^\s`)]+\.generated\.ya?ml/
  },
  {
    label: "local environment file path",
    pattern: /(^|[`'\s])\.env(?!\.example|\.local\.example)\b/
  }
];

const failures = [];

for (const filePath of requiredFiles) {
  if (!trackedFileSet.has(filePath)) {
    failures.push(`required file is not tracked: ${filePath}`);
    continue;
  }

  if (!existsSync(filePath)) {
    failures.push(`required file is missing: ${filePath}`);
  }
}

for (const requirement of requiredText) {
  const contents = readFileSync(requirement.filePath, "utf8");

  for (const expected of requirement.includes) {
    if (!contents.includes(expected)) {
      failures.push(`${requirement.filePath} is missing expected reviewer evidence: ${expected}`);
    }
  }
}

for (const filePath of publicMarkdownFiles) {
  const contents = readFileSync(filePath, "utf8");

  for (const forbidden of forbiddenPublicDocPatterns) {
    if (forbidden.pattern.test(contents)) {
      failures.push(`${filePath} contains ${forbidden.label}`);
    }
  }

  for (const linkTarget of extractMarkdownLinkTargets(contents)) {
    checkMarkdownLink(filePath, linkTarget);
  }
}

if (failures.length > 0) {
  console.error("Reviewer evidence smoke failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Reviewer evidence smoke passed.");
}

function extractMarkdownLinkTargets(contents) {
  const targets = [];
  const markdownLinkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  let match;

  while ((match = markdownLinkPattern.exec(contents)) !== null) {
    const rawTarget = match[1].trim().split(/\s+/)[0];
    targets.push(stripAngleBrackets(rawTarget));
  }

  return targets;
}

function stripAngleBrackets(value) {
  if (value.startsWith("<") && value.endsWith(">")) {
    return value.slice(1, -1);
  }

  return value;
}

function checkMarkdownLink(sourceFilePath, rawTarget) {
  if (
    rawTarget === "" ||
    rawTarget.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:/i.test(rawTarget)
  ) {
    return;
  }

  const [pathWithoutAnchor] = rawTarget.split("#");
  if (pathWithoutAnchor === "") {
    return;
  }

  let decodedPath = pathWithoutAnchor;
  try {
    decodedPath = decodeURIComponent(pathWithoutAnchor);
  } catch {
    failures.push(`${sourceFilePath} has an invalid encoded Markdown link: ${rawTarget}`);
    return;
  }

  const resolvedPath = normalize(join(dirname(sourceFilePath), decodedPath));

  if (!existsSync(resolvedPath)) {
    failures.push(`${sourceFilePath} links to missing local target: ${rawTarget}`);
    return;
  }

  const stats = statSync(resolvedPath);
  if (!stats.isFile() && !stats.isDirectory()) {
    failures.push(`${sourceFilePath} links to unsupported local target: ${rawTarget}`);
  }
}
