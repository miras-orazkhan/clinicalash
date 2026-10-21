import { Suspense } from "react";
import { DoctorsPage } from "@/components/alash/pages/DoctorsPage";

export default function Page() {
  return (
    <Suspense>
      <DoctorsPage />
    </Suspense>
  );
}
