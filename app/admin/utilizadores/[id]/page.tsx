import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN", "RECRUITER");
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      candidate: { include: { _count: { select: { applications: true } } } },
      client: true,
      documents: { orderBy: { uploadedAt: "desc" }, select: { id: true, type: true, status: true, originalName: true, uploadedAt: true } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 15, select: { action: true, entity: true, createdAt: true } },
      _count: { select: { ServiceRequest: true } },
    },
  });
  if (!user) notFound();

  return (
    <main className="admin-page">
      <Link href="/admin/utilizadores" className="admin-back-link">← Voltar aos utilizadores</Link>
      <header className="admin-page-header">
        <div>
          <span className="professional-eyebrow">{user.role}</span>
          <h1>{user.firstName} {user.lastName}</h1>
          <p>{user.email} · {user.phone ?? "Sem telefone"}</p>
        </div>
        <span className={`admin-status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
      </header>

      <section className="admin-detail-grid">
        <article className="professional-form-card">
          <h2>Dados da conta</h2>
          <dl className="admin-detail-list">
            <dt>Estado</dt><dd>{user.status}</dd>
            <dt>Motivo do estado</dt><dd>{user.statusReason ?? "—"}</dd>
            <dt>Sessão criada</dt><dd>{user.createdAt.toLocaleString("pt-PT")}</dd>
            <dt>Último acesso</dt><dd>{user.lastLoginAt?.toLocaleString("pt-PT") ?? "Nunca"}</dd>
            {user.candidate && <>
              <dt>Profissão</dt><dd>{user.candidate.professionalTitle ?? "—"}</dd>
              <dt>Cidade</dt><dd>{user.candidate.city ?? "—"}</dd>
              <dt>Experiência</dt><dd>{user.candidate.yearsExperience ?? "—"}</dd>
            </>}
            {user.client && <>
              <dt>Organização</dt><dd>{user.client.companyName ?? "—"}</dd>
              <dt>Cidade</dt><dd>{user.client.city ?? "—"}</dd>
            </>}
          </dl>
        </article>
        <article className="professional-form-card">
          <h2>Atividade relacionada</h2>
          <p>{user.candidate?._count.applications ?? 0} candidaturas</p>
          <p>{user._count.ServiceRequest} pedidos</p>
          <h3>Documentos</h3>
          {user.documents.length === 0 ? <p>Sem documentos.</p> :
            <ul className="admin-compact-list">
              {user.documents.map((document) => <li key={document.id}>{document.originalName} · {document.type} · {document.status}</li>)}
            </ul>}
          <h3>Atividade administrativa recente</h3>
          {user.auditLogs.length === 0 ? <p>Sem ações auditadas.</p> :
            <ul className="admin-compact-list">
              {user.auditLogs.map((log, index) => <li key={`${log.action}-${index}`}>{log.action} · {log.createdAt.toLocaleString("pt-PT")}</li>)}
            </ul>}
        </article>
      </section>
    </main>
  );
}
