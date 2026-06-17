import { getSupportingDocumentDownload } from "@ssq/services/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string; referenceNumber: string }> }
) {
  const { documentId, referenceNumber } = await params;
  const document = await getSupportingDocumentDownload("rental-security-subsidy", referenceNumber, documentId);

  return new Response(document.body, {
    headers: {
      "content-disposition": `attachment; filename="${document.filename}"`,
      "content-type": `${document.contentType}; charset=utf-8`
    }
  });
}
