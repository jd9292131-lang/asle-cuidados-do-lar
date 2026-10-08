import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import NotificationList from "../../notificacoes/NotificationList";

export default async function CandidateNotificationsPage() {
  const user = await requireRole("CANDIDATE");
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <main className="professional-page">
      <header className="professional-page-header"><div><span className="professional-eyebrow">ÁREA PROFISSIONAL</span><h1>Notificações</h1><p>Avisos, mensagens e atualizações da equipa ASLE.</p></div></header>
      <NotificationList notifications={notifications.map((item) => ({ ...item, readAt: item.readAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString() }))} />
    </main>
  );
}
