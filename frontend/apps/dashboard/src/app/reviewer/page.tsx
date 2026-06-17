import { ReviewerQueueContainer } from "../../containers/ReviewerQueueContainer";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ReviewerQueueContainer searchParams={searchParams ? await searchParams : {}} />;
}
