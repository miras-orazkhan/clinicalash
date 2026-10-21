import { isAdmin } from "@/lib/alash/admin-auth";
import { AdminShell } from "@/components/alash/admin/AdminShell";

export const dynamic = "force-dynamic";

export const metadata = { title: "Админ-панель — «Алаш»" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  return <AdminShell authed={authed}>{children}</AdminShell>;
}
