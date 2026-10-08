import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import UserActions from "./UserActions";

const roleLabels = {
  ADMIN: "Administrador",
  RECRUITER: "Recrutador",
  CANDIDATE: "Profissional",
  CLIENT: "Cliente",
} as const;

const statusLabels = {
  ACTIVE: "Ativo",
  INACTIVE: "Bloqueado",
  SUSPENDED: "Suspenso",
  PENDING: "Pendente",
} as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN", "RECRUITER");
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const role = ["ADMIN", "RECRUITER", "CANDIDATE", "CLIENT"].includes(params.role ?? "")
    ? (params.role as keyof typeof roleLabels)
    : undefined;
  const status = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"].includes(params.status ?? "")
    ? (params.status as keyof typeof statusLabels)
    : undefined;
  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q ? {
      OR: [
        { email: { contains: q, mode: "insensitive" as const } },
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 30,
      take: 30,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        statusReason: true,
        suspendedUntil: true,
        createdAt: true,
        candidate: { select: { professionalTitle: true, city: true } },
        client: { select: { companyName: true, city: true } },
        _count: { select: { documents: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  const hasPrevious = page > 1;
  const hasNext = page * 30 < total;
  const makePageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (role) query.set("role", role);
    if (status) query.set("status", status);
    query.set("page", String(nextPage));
    return `/admin/utilizadores?${query.toString()}`;
  };

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="professional-eyebrow">GESTÃO DA PLATAFORMA</span>
          <h1>Utilizadores</h1>
          <p>Pesquisa e gestão de contas de clientes e profissionais.</p>
        </div>
        <span className="admin-total">{total} contas</span>
      </header>

      <form className="admin-filters" method="GET">
        <input name="q" defaultValue={q} placeholder="Nome, e-mail ou telefone" aria-label="Pesquisar utilizadores" />
        <select name="role" defaultValue={role ?? ""} aria-label="Filtrar por perfil">
          <option value="">Todos os perfis</option>
          {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} aria-label="Filtrar por estado">
          <option value="">Todos os estados</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="primary-button" type="submit">Pesquisar</button>
      </form>

      <section className="admin-user-list" aria-label="Resultados">
        {users.length === 0 ? <div className="professional-form-card"><h2>Sem resultados</h2><p>Altere os filtros e tente novamente.</p></div> :
          users.map((user) => {
            const description = user.role === "CANDIDATE"
              ? [user.candidate?.professionalTitle, user.candidate?.city].filter(Boolean).join(" · ")
              : user.role === "CLIENT"
                ? [user.client?.companyName, user.client?.city].filter(Boolean).join(" · ")
                : "";
            const canDelete = actor.role === "ADMIN" && (user.role === "CLIENT" || user.role === "CANDIDATE");

            return (
              <article className="admin-user-card" key={user.id}>
                <div className="admin-user-details">
                  <Link href={`/admin/utilizadores/${user.id}`} className="admin-user-name">{user.firstName} {user.lastName}</Link>
                  <span>{roleLabels[user.role]} · {user.email}</span>
                  {user.phone && <span>{user.phone}</span>}
                  {description && <span>{description}</span>}
                  {user.statusReason && <span className="admin-user-reason">Motivo: {user.statusReason}</span>}
                  {user.suspendedUntil && <span>Suspenso até {user.suspendedUntil.toLocaleString("pt-PT")}</span>}
                </div>
                <div className="admin-user-meta">
                  <span className={`admin-status-badge ${user.status.toLowerCase()}`}>{statusLabels[user.status]}</span>
                  <small>Registado {user.createdAt.toLocaleDateString("pt-PT")}</small>
                  <small>{user._count.documents} documentos</small>
                  <UserActions
                    userId={user.id}
                    userName={`${user.firstName} ${user.lastName}`}
                    status={user.status}
                    canDelete={canDelete}
                    adminCanChange={actor.role === "ADMIN" && user.role !== "ADMIN"}
                  />
                </div>
              </article>
            );
          })}
      </section>

      <nav className="admin-pagination" aria-label="Paginação">
        {hasPrevious ? <Link href={makePageHref(page - 1)}>Anterior</Link> : <span />}
        <span>Página {page} de {Math.max(1, Math.ceil(total / 30))}</span>
        {hasNext ? <Link href={makePageHref(page + 1)}>Seguinte</Link> : <span />}
      </nav>
    </main>
  );
}
