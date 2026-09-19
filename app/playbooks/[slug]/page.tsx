import { PlaybookDetail } from "@/components/PlaybookDetail";

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PlaybookDetail slug={slug} />;
}
