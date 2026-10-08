import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import NotificationList from "../../notificacoes/NotificationList";

export default async function ClientNotificationsPage() {
  const user = await requireRole("CLIENT");
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <main className="client-page">
      <header className="client-page-header"><div><span className="professional-eyebrow">ÁREA DO CLIENTE</span><h1>Notificações</h1><p>Avisos e atualizações dos seus pedidos.</p></div></header>
      <NotificationList notifications={notifications.map((item) => ({ ...item, readAt: item.readAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString() }))} />
    </main>
  );
}
