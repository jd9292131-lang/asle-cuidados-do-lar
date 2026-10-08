import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "CLIENT") {
    redirect(user.role === "CANDIDATE" ? "/profissional/dashboard" : "/admin/dashboard");
  }

  return children;
}
