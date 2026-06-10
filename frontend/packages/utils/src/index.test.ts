import { describe, expect, it } from "vitest";

import { formatPrototypeLabel } from "./index";

describe("formatPrototypeLabel", () => {
  it("formats hyphenated prototype labels", () => {
    expect(formatPrototypeLabel("rental-security-subsidy")).toBe("Rental Security Subsidy");
  });
});
