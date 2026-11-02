import { DoctorPage } from "@/components/alash/pages/DoctorPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorPage id={id} />;
}
