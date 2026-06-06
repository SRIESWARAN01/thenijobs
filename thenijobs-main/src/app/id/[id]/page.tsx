import IdCardPageClient from './IdCardPageClient';

export function generateStaticParams() {
  return [];
}

export default async function IdCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IdCardPageClient id={id} />;
}
