import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 50,
      take: 50,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><span className="professional-eyebrow">SEGURANÇA</span><h1>Auditoria</h1><p>Registo cronológico das alterações administrativas e eventos importantes.</p></div><span className="admin-total">{total} eventos</span></header>
      <section className="admin-user-list">
        {logs.length === 0 ? <article className="professional-form-card"><h2>Sem eventos registados</h2></article> :
          logs.map((log) => (
            <article className="admin-audit-row" key={log.id}>
              <div><strong>{log.action}</strong><span>{log.entity}{log.entityId ? ` · ${log.entityId}` : ""}</span></div>
              <div><strong>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistema"}</strong><span>{log.user?.email ?? ""}</span></div>
              <time dateTime={log.createdAt.toISOString()}>{log.createdAt.toLocaleString("pt-PT")}</time>
              {log.metadata && <details><summary>Detalhes</summary><pre>{JSON.stringify(log.metadata, null, 2)}</pre></details>}
            </article>
          ))}
      </section>
      <nav className="admin-pagination" aria-label="Paginação">
        {page > 1 ? <a href={`/admin/auditoria?page=${page - 1}`}>Anterior</a> : <span />}
        <span>Página {page} de {Math.max(1, Math.ceil(total / 50))}</span>
        {page * 50 < total ? <a href={`/admin/auditoria?page=${page + 1}`}>Seguinte</a> : <span />}
      </nav>
    </main>
  );
}
