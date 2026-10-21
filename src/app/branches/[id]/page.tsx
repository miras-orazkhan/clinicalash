import { BranchPage } from "@/components/alash/pages/BranchPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BranchPage id={id} />;
}
