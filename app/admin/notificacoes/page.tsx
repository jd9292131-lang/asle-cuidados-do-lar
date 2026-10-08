import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import AnnouncementForm from "./AnnouncementForm";

const audienceLabels: Record<string, string> = {
  ALL: "Todos",
  CANDIDATES: "Profissionais",
  CLIENTS: "Clientes",
  RECRUITERS: "Recrutadores",
  ADMINS: "Administradores",
  SPECIFIC_USERS: "Selecionados",
};

export default async function AdminNotificationsPage() {
  await requireRole("ADMIN", "RECRUITER");
  const [users, announcements] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: ["CANDIDATE", "CLIENT"] } },
      orderBy: { firstName: "asc" },
      take: 500,
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { AnnouncementRecipient: true } } },
    }),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><span className="professional-eyebrow">COMUNICAÇÃO</span><h1>Notificações</h1><p>Publique avisos na plataforma para utilizadores ativos; sem envio externo automático.</p></div></header>
      <section className="admin-operations-layout">
        <AnnouncementForm users={users.map(({ id, firstName, lastName, email, role }) => ({
          id,
          name: `${firstName} ${lastName}`,
          email,
          role,
        }))} />
        <div className="admin-job-list">
          {announcements.length === 0 ? <article className="professional-form-card"><h2>Sem avisos publicados</h2></article> :
            announcements.map((announcement) => (
              <article className="professional-form-card admin-job-card" key={announcement.id}>
                <span className="card-label">{audienceLabels[announcement.audience]} · {announcement._count.AnnouncementRecipient} destinatários · {announcement.createdAt.toLocaleString("pt-PT")}</span>
                <h2>{announcement.title}</h2>
                <p>{announcement.content}</p>
                <small>{announcement.status}</small>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
