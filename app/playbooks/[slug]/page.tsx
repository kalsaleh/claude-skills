import { PlaybookDetail } from "@/components/PlaybookDetail";

export function generateStaticParams() {
  return [{ slug: "cross-dept" }, { slug: "promotion" }];
}

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PlaybookDetail slug={slug} />;
}
