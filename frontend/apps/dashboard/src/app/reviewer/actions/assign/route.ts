import { assignReviewerRequest } from "@ssq/services/server";
import { NextResponse } from "next/server";

function formValue(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const referenceNumber = formValue(formData.get("referenceNumber"));
  const redirectUrl = new URL(referenceNumber ? `/reviewer/${encodeURIComponent(referenceNumber)}` : "/reviewer", request.url);

  if (!referenceNumber) {
    redirectUrl.searchParams.set("assignment", "missing-reference");

    return NextResponse.redirect(redirectUrl, 303);
  }

  const result = await assignReviewerRequest({
    assignedOfficerSubject: formValue(formData.get("assignedOfficerSubject")),
    assignedTeam: formValue(formData.get("assignedTeam")),
    reason: formValue(formData.get("reason")),
    referenceNumber
  });

  redirectUrl.searchParams.set("assignment", result.ok ? "updated" : "failed");

  return NextResponse.redirect(redirectUrl, 303);
}
