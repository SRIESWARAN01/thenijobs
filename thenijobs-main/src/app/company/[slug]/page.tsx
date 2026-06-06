import CompanyProfilePageClient from './CompanyProfilePageClient';

export function generateStaticParams() {
  return [];
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CompanyProfilePageClient slug={slug} />;
}
