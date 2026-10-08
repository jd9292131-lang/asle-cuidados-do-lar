import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminNav from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "ADMIN" && user.role !== "RECRUITER") {
    redirect(user.role === "CLIENT" ? "/cliente/dashboard" : "/profissional/dashboard");
  }

  return (
    <div className="admin-shell">
      <AdminNav user={user} />
      <div className="admin-content">{children}</div>
    </div>
  );
}
