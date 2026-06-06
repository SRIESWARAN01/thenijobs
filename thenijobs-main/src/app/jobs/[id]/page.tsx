import JobDetailPageClient from './JobDetailPageClient';

export function generateStaticParams() {
  return [];
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobDetailPageClient id={id} />;
}
