import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import CleanupButton from "./CleanupButton";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN", "RECRUITER");

  const [candidateCount, clientCount, openRequests, pendingDocuments, openApplications, upcomingInterviews, pendingCleanup, recentRequests] =
    await Promise.all([
      prisma.user.count({ where: { role: "CANDIDATE" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.serviceRequest.count({
        where: { status: { in: ["SUBMITTED", "IN_REVIEW", "MATCHING"] } },
      }),
      prisma.document.count({ where: { status: "PENDING" } }),
      prisma.application.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.interview.count({ where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } } }),
      prisma.blobCleanup.count(),
      prisma.serviceRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          serviceType: true,
          location: true,
          status: true,
          createdAt: true,
          User: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="professional-eyebrow">PAINEL ASLE</span>
          <h1>Visão geral</h1>
          <p>Prioridades operacionais e atividade recente da plataforma.</p>
        </div>
      </header>

      <section className="admin-stat-grid" aria-label="Resumo da plataforma">
        <Link className="admin-stat-card" href="/admin/utilizadores?role=CANDIDATE"><span className="card-label">PROFISSIONAIS</span><strong>{candidateCount}</strong><small>Ver utilizadores</small></Link>
        <Link className="admin-stat-card" href="/admin/utilizadores?role=CLIENT"><span className="card-label">CLIENTES</span><strong>{clientCount}</strong><small>Ver utilizadores</small></Link>
        <Link className="admin-stat-card" href="/admin/pedidos"><span className="card-label">PEDIDOS EM ABERTO</span><strong>{openRequests}</strong><small>Rever pedidos</small></Link>
        <Link className="admin-stat-card" href="/admin/documentos"><span className="card-label">DOCUMENTOS PENDENTES</span><strong>{pendingDocuments}</strong><small>Rever documentos</small></Link>
        <Link className="admin-stat-card" href="/admin/candidaturas"><span className="card-label">CANDIDATURAS EM ANÁLISE</span><strong>{openApplications}</strong><small>Acompanhar seleção</small></Link>
        <Link className="admin-stat-card" href="/admin/entrevistas"><span className="card-label">ENTREVISTAS FUTURAS</span><strong>{upcomingInterviews}</strong><small>Ver calendário</small></Link>
      </section>

      {pendingCleanup > 0 && <section className="admin-cleanup-banner"><div><strong>{pendingCleanup} ficheiros aguardam limpeza no armazenamento.</strong><span>O processo de eliminação mantém estes itens na fila para nova tentativa.</span></div><CleanupButton /></section>}

      <section className="professional-form-card admin-requests">
        <div className="admin-section-title"><div><span className="card-label">ATIVIDADE RECENTE</span><h2>Pedidos de clientes</h2></div><Link href="/admin/pedidos">Ver todos</Link></div>
        {recentRequests.length === 0 ? (
          <p>Ainda não foram recebidos pedidos.</p>
        ) : (
          <div className="client-request-list">
            {recentRequests.map((request) => (
              <article className="client-request-item" key={request.id}>
                <div className="client-request-heading">
                  <h3>{request.title}</h3>
                  <span>{request.status.replaceAll("_", " ")}</span>
                </div>
                <p>{request.User.firstName} {request.User.lastName} · {request.User.email}</p>
                <p>{request.location ?? "Localização não indicada"} · {request.serviceType.replaceAll("_", " ")}</p>
                <time dateTime={request.createdAt.toISOString()}>
                  {request.createdAt.toLocaleDateString("pt-PT")}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
