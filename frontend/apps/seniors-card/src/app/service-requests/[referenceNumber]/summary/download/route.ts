import { getSubmissionSummaryDownload } from "@ssq/services/server";

export async function GET(_request: Request, { params }: { params: Promise<{ referenceNumber: string }> }) {
  const { referenceNumber } = await params;
  const summary = await getSubmissionSummaryDownload("seniors-card", referenceNumber);

  return new Response(summary.body, {
    headers: {
      "content-disposition": `attachment; filename="${summary.filename}"`,
      "content-type": `${summary.contentType}; charset=utf-8`
    }
  });
}
