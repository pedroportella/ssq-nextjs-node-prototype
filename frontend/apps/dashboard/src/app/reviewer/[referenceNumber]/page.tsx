import { ReviewerRequestDetailContainer } from "../../../containers/ReviewerQueueContainer";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ referenceNumber: string }> }) {
  const { referenceNumber } = await params;

  return <ReviewerRequestDetailContainer referenceNumber={referenceNumber} />;
}
