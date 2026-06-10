import { describe, expect, it } from "vitest";

import { createPrototypeAppSummary } from "./index";

describe("createPrototypeAppSummary", () => {
  it("returns a typed app summary", () => {
    expect(createPrototypeAppSummary("seniors-card")).toEqual({
      key: "seniors-card",
      label: "Seniors Card",
      status: "UP"
    });
  });
});
