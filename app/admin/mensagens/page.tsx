import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import MessageComposer from "./MessageComposer";

export default async function AdminMessagesPage() {
  await requireRole("ADMIN", "RECRUITER");
  const [recipients, messages] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: ["CANDIDATE", "CLIENT"] } },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
      take: 500,
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    }),
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        User_Message_senderIdToUser: { select: { firstName: true, lastName: true } },
        User_Message_recipientIdToUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><span className="professional-eyebrow">COMUNICAÇÃO</span><h1>Mensagens</h1><p>Envie mensagens diretas e consulte as conversas recentes.</p></div></header>
      <section className="admin-operations-layout">
        <MessageComposer recipients={recipients} />
        <div className="admin-job-list">
          {messages.length === 0 ? <article className="professional-form-card"><h2>Sem mensagens</h2><p>As mensagens recentes aparecerão aqui.</p></article> :
            messages.map((message) => (
              <article className="professional-form-card admin-job-card" key={message.id}>
                <span className="card-label">{message.createdAt.toLocaleString("pt-PT")} · {message.status}</span>
                <h2>{message.subject ?? "Mensagem"}</h2>
                <p>De {message.User_Message_senderIdToUser.firstName} {message.User_Message_senderIdToUser.lastName} para <a href={`/admin/utilizadores/${message.User_Message_recipientIdToUser.id}`}>{message.User_Message_recipientIdToUser.firstName} {message.User_Message_recipientIdToUser.lastName}</a> ({message.User_Message_recipientIdToUser.email})</p>
                <p>{message.body}</p>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
