import { describe, expect, it } from "vitest";

import { POST as assignPost } from "../app/reviewer/actions/assign/route";
import { POST as batchStatusPost } from "../app/reviewer/actions/batch-status/route";

function formRequest(url: string, body: URLSearchParams) {
  return new Request(url, {
    body,
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  });
}

describe("reviewer action routes", () => {
  it("applies batch status updates and redirects to the queue", async () => {
    const response = await batchStatusPost(
      formRequest("http://localhost/reviewer/actions/batch-status", new URLSearchParams([
        ["referenceNumbers", "SC-2026-0001"],
        ["status", "IN_REVIEW"],
        ["reason", "Queue triage"]
      ]))
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/reviewer?batch=updated");
  });

  it("assigns a request and redirects back to detail", async () => {
    const response = await assignPost(
      formRequest("http://localhost/reviewer/actions/assign", new URLSearchParams([
        ["referenceNumber", "SC-2026-0001"],
        ["assignedOfficerSubject", "officer@example.test"],
        ["assignedTeam", "Seniors Card"],
        ["reason", "Picked up from queue"]
      ]))
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/reviewer/SC-2026-0001?assignment=updated");
  });
});
