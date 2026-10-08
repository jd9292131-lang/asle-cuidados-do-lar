import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import ProfessionalNav from "./ProfessionalNav";

export default async function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "CANDIDATE") {
    redirect(user.role === "CLIENT" ? "/cliente/dashboard" : "/admin/dashboard");
  }

  return (
    <div className="professional-shell">
      <ProfessionalNav user={user} />

      <div className="professional-content">
        {children}
      </div>
    </div>
  );
}