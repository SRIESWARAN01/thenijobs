import CompanyProfilePageClient from './CompanyProfilePageClient';

const STATIC_COMPANY_SLUGS = [
  'digital-theni-solutions',
  'arasu-pandi-farm-services',
  'greenfield-agro-exports',
  'quickdeliver-logistics',
  'theni-textiles',
  'thenijobs-demo-company',
];

export function generateStaticParams() {
  return STATIC_COMPANY_SLUGS.map((slug) => ({ slug }));
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CompanyProfilePageClient slug={slug} />;
}
