import { describe, expect, it } from "vitest";

import { prototypeAssetManifest } from "./index";

describe("prototypeAssetManifest", () => {
  it("starts with empty asset groups", () => {
    expect(prototypeAssetManifest.logos.prototypeWordmark.label).toBe("SSQ prototype");
    expect(prototypeAssetManifest.icons.statusUp.symbol).toBe("check");
  });
});
