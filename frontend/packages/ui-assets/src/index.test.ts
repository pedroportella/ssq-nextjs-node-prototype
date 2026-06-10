import { describe, expect, it } from "vitest";

import { prototypeAssetManifest } from "./index";

describe("prototypeAssetManifest", () => {
  it("starts with empty asset groups", () => {
    expect(prototypeAssetManifest).toEqual({
      logos: {},
      icons: {}
    });
  });
});
