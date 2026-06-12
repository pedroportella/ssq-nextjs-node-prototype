import { describe, expect, it } from "vitest";

import { prototypeAssetManifest } from "./index";
import qgovLogoUrlBrand from "../logos/header-logo-qgov-url";
import qldIconsUrl from "../icons/qld-icons-url";
import svgIconsUrl from "../icons/svg-icons-url";

describe("prototypeAssetManifest", () => {
  it("starts with empty asset groups", () => {
    expect(prototypeAssetManifest.logos.prototypeWordmark.label).toBe("SSQ prototype");
    expect(prototypeAssetManifest.icons.statusUp.symbol).toBe("check");
  });

  it("exports copied RBDM QGov logo and icon sprite URL helpers", () => {
    expect(qgovLogoUrlBrand).toContain("header-logo-qgov--brand.svg");
    expect(qldIconsUrl).toContain("QLD-icons.svg");
    expect(svgIconsUrl).toContain("svg-icons.svg");
  });
});
