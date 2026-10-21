import { SpecialtyPage } from "@/components/alash/pages/SpecialtyPage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SpecialtyPage slug={slug} />;
}
