import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const qhdsIconSpritePattern = /[\\/]packages[\\/]ui-assets[\\/]icons[\\/](?:QLD-icons|QLD-Health-icons|svg-icons)\.svg$/;

interface WebpackRule {
  exclude?: unknown;
  oneOf?: unknown[];
  rules?: unknown[];
  test?: {
    test?: (value: string) => boolean;
  };
}

function addExclude(rule: WebpackRule, excludedPattern: RegExp) {
  if (Array.isArray(rule.exclude)) {
    rule.exclude = [...rule.exclude, excludedPattern];
    return;
  }

  rule.exclude = rule.exclude ? [rule.exclude, excludedPattern] : excludedPattern;
}

function excludeQhdsIconSpritesFromImageRules(rules: unknown[]) {
  for (const rule of rules) {
    if (!rule || typeof rule !== "object") {
      continue;
    }

    const webpackRule = rule as WebpackRule;

    if (webpackRule.test?.test?.("sprite.svg")) {
      addExclude(webpackRule, qhdsIconSpritePattern);
    }

    if (Array.isArray(webpackRule.oneOf)) {
      excludeQhdsIconSpritesFromImageRules(webpackRule.oneOf);
    }

    if (Array.isArray(webpackRule.rules)) {
      excludeQhdsIconSpritesFromImageRules(webpackRule.rules);
    }
  }
}

export function createSsqNextConfig(): NextConfig {
  return {
    output: "standalone",
    outputFileTracingRoot: repoRoot,
    poweredByHeader: false,
    transpilePackages: ["@ssq/services", "@ssq/ui-assets", "@ssq/ui-library", "@ssq/ui-tokens", "@ssq/utils"],
    turbopack: {},
    webpack(config) {
      excludeQhdsIconSpritesFromImageRules(config.module.rules);
      config.module.rules.push({
        generator: {
          filename: "static/media/[name].[hash][ext]"
        },
        test: qhdsIconSpritePattern,
        type: "asset/resource"
      });

      return config;
    }
  };
}
