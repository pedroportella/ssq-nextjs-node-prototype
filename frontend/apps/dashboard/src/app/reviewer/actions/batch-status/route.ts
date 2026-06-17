import { batchUpdateReviewerRequestStatus } from "@ssq/services/server";
import { NextResponse } from "next/server";

function formValue(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const referenceNumbers = formData
    .getAll("referenceNumbers")
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const status = formValue(formData.get("status"));
  const reason = formValue(formData.get("reason"));
  const redirectUrl = new URL("/reviewer", request.url);

  if (status === "IN_REVIEW") {
    const result = await batchUpdateReviewerRequestStatus({
      reason,
      referenceNumbers,
      status
    });

    redirectUrl.searchParams.set("batch", result.ok ? "updated" : "partial");
  } else {
    redirectUrl.searchParams.set("batch", "invalid");
  }

  return NextResponse.redirect(redirectUrl, 303);
}
