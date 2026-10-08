import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function MessagesPage() {
  const user = await requireRole("CANDIDATE");
  const messages = await prisma.message.findMany({
    where: { OR: [{ recipientId: user.id }, { senderId: user.id }] },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
      recipientId: true,
      User_Message_senderIdToUser: { select: { firstName: true, lastName: true } },
      User_Message_recipientIdToUser: { select: { firstName: true, lastName: true } },
    },
  });

  return (
    <main className="professional-page">
      <header className="professional-page-header">
        <div>
          <span className="professional-eyebrow">ÁREA PROFISSIONAL</span>
          <h1>Mensagens</h1>
          <p>Mensagens enviadas e recebidas através da equipa ASLE.</p>
        </div>
      </header>

      {messages.length === 0 ? (
        <section className="professional-form-card">
          <h2>Ainda não tem mensagens</h2>
          <p>Quando a equipa ASLE lhe enviar uma mensagem, poderá consultá-la aqui.</p>
        </section>
      ) : (
        <div className="professional-list">
          {messages.map((message) => {
            const sentByUser = message.senderId === user.id;
            const contact = sentByUser
              ? message.User_Message_recipientIdToUser
              : message.User_Message_senderIdToUser;

            return (
              <article className="professional-form-card" key={message.id}>
                <span className="card-label">{sentByUser ? "ENVIADA" : "RECEBIDA"}</span>
                <h2>{sentByUser ? "Para" : "De"} {contact.firstName} {contact.lastName}</h2>
                <p>{message.body}</p>
                <time dateTime={message.createdAt.toISOString()}>
                  {message.createdAt.toLocaleString("pt-PT")}
                </time>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
