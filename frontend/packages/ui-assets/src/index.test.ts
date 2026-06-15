import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  prototypeAssetManifest,
  qhdsCoreIconNames,
  qhdsHealthIconNames,
  qhdsIconSprites,
  qhdsUtilityIconNames
} from "./index";
import qgovLogoUrlBrand from "../logos/header-logo-qgov-url";
import qldHealthIconsUrl from "../icons/qld-health-icons-url";
import qldIconsUrl from "../icons/qld-icons-url";
import svgIconsUrl from "../icons/svg-icons-url";

function readSprite(path: string) {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

function expectSpriteIds(sprite: string, ids: readonly string[]) {
  for (const id of ids) {
    expect(sprite).toContain(`id="${id}"`);
  }
}

describe("prototypeAssetManifest", () => {
  it("exposes QHDS sprite metadata and required icon names", () => {
    expect(prototypeAssetManifest.logos.prototypeWordmark.label).toBe("SSQ prototype");
    expect(prototypeAssetManifest.icons.sprites).toBe(qhdsIconSprites);
    expect(prototypeAssetManifest.icons.names.qld).toBe(qhdsCoreIconNames);
    expect(prototypeAssetManifest.icons.names.qldHealth).toBe(qhdsHealthIconNames);
    expect(prototypeAssetManifest.icons.names.utility).toBe(qhdsUtilityIconNames);
    expect(qhdsIconSprites.qld.fileName).toBe("QLD-icons.svg");
    expect(qhdsIconSprites.qldHealth.extendedPrefix).toBe("extended_");
  });

  it("exports copied QGov logo and QHDS icon sprite URL helpers", () => {
    expect(qgovLogoUrlBrand).toContain("header-logo-qgov--brand.svg");
    expect(qldHealthIconsUrl).toContain("QLD-Health-icons.svg");
    expect(qldIconsUrl).toContain("QLD-icons.svg");
    expect(svgIconsUrl).toContain("svg-icons.svg");
  });

  it("keeps required QHDS icon ids available in copied sprites", () => {
    expectSpriteIds(readSprite("../icons/QLD-icons.svg"), qhdsCoreIconNames);
    expectSpriteIds(readSprite("../icons/QLD-Health-icons.svg"), qhdsHealthIconNames);
    expectSpriteIds(readSprite("../icons/svg-icons.svg"), qhdsUtilityIconNames);
  });

  it("uses fresh QHDS core sprite ids instead of stale renamed ids", () => {
    const qldSprite = readSprite("../icons/QLD-icons.svg");

    expectSpriteIds(qldSprite, ["alert-cancel-filled", "alert-maintenance", "facebook", "instagram", "linkedin", "x", "youtube"]);
    expect(qldSprite).not.toContain('id="alert-maintenance-"');
    expect(qldSprite).not.toContain('id="Facebook"');
    expect(qldSprite).not.toContain('id="Instagram"');
    expect(qldSprite).not.toContain('id="LinkedIn"');
    expect(qldSprite).not.toContain('id="X"');
    expect(qldSprite).not.toContain('id="YouTube"');
  });
});
