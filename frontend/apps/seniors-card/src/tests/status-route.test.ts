import { describe, expect, it } from "vitest";

import { GET } from "../app/status/route";

describe("seniors card status route", () => {
  it("returns the app health payload", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      app: "seniors-card",
      status: "UP"
    });
  });
});
