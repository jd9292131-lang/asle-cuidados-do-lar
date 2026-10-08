import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import StaffAccountForm from "./StaffAccountForm";

const roleLabels = {
  ADMIN: "Administrador",
  RECRUITER: "Recrutador",
} as const;

export default async function AdminTeamPage() {
  await requireRole("ADMIN");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "RECRUITER"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="professional-eyebrow">ACESSO RESTRITO A ADMINISTRADORES</span>
          <h1>Equipa administrativa</h1>
          <p>Crie contas de administração e recrutamento e acompanhe os acessos da equipa.</p>
        </div>
        <span className="admin-total">{staff.length} contas</span>
      </header>

      <StaffAccountForm />

      <section className="admin-user-list" aria-label="Contas administrativas">
        <div className="admin-section-title">
          <div>
            <span className="card-label">ACESSO À PLATAFORMA</span>
            <h2>Contas da equipa</h2>
          </div>
        </div>
        {staff.map((user) => (
          <article className="admin-user-card" key={user.id}>
            <div className="admin-user-details">
              <Link href={`/admin/utilizadores/${user.id}`} className="admin-user-name">
                {user.firstName} {user.lastName}
              </Link>
              <span>{(user.role === "ADMIN" ? roleLabels.ADMIN : roleLabels.RECRUITER)} · {user.email}</span>
              <span>Criada {user.createdAt.toLocaleDateString("pt-PT")}</span>
            </div>
            <div className="admin-user-meta">
              <span className={`admin-status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
              <small>Último acesso {user.lastLoginAt?.toLocaleString("pt-PT") ?? "Nunca"}</small>
              {user.role === "RECRUITER" && (
                <Link href={`/admin/utilizadores?q=${encodeURIComponent(user.email)}&role=RECRUITER`}>
                  Gerir estado
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <p className="admin-team-note">
        Contas ADMIN não podem ser bloqueadas ou eliminadas pela gestão normal, para evitar a perda de acesso administrativo.
      </p>
    </main>
  );
}
