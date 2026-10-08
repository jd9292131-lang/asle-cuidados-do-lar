import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import MessageForm from "./MessageForm";

export default async function ClientMessagesPage() {
  const user = await requireRole("CLIENT");
  const messages = await prisma.message.findMany({
    where: { OR: [{ recipientId: user.id }, { senderId: user.id }] },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      User_Message_senderIdToUser: { select: { firstName: true, lastName: true } },
      User_Message_recipientIdToUser: { select: { firstName: true, lastName: true } },
    },
  });
  const unread = messages.filter((message) => message.recipientId === user.id && message.status === "SENT").map((message) => message.id);
  if (unread.length > 0) {
    await prisma.message.updateMany({ where: { id: { in: unread }, recipientId: user.id }, data: { status: "READ", readAt: new Date() } });
  }

  return (
    <main className="client-page">
      <header className="client-page-header"><div><span className="professional-eyebrow">ÁREA DO CLIENTE</span><h1>Mensagens</h1><p>Contacte a equipa ASLE e consulte as respostas.</p></div></header>
      <section className="admin-operations-layout">
        <MessageForm />
        <div className="admin-job-list">
          {messages.length === 0 ? <article className="professional-form-card"><h2>Sem mensagens</h2><p>As conversas com a equipa ASLE aparecerão aqui.</p></article> :
            messages.map((message) => {
              const sent = message.senderId === user.id;
              const other = sent ? message.User_Message_recipientIdToUser : message.User_Message_senderIdToUser;
              return <article className="professional-form-card admin-job-card" key={message.id}><span className="card-label">{sent ? "ENVIADA" : "RECEBIDA"} · {message.createdAt.toLocaleString("pt-PT")}</span><h2>{message.subject ?? "Mensagem"}</h2><p>{sent ? "Para" : "De"} {other.firstName} {other.lastName}</p><p>{message.body}</p></article>;
            })}
        </div>
      </section>
    </main>
  );
}
