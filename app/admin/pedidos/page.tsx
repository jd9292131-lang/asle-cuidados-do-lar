import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import RecordStatusForm from "../RecordStatusForm";

const requestStatuses = [
  { value: "SUBMITTED", label: "Recebido" },
  { value: "IN_REVIEW", label: "Em análise" },
  { value: "MATCHING", label: "À procura" },
  { value: "PROPOSED", label: "Proposta enviada" },
  { value: "ACCEPTED", label: "Aceite" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default async function AdminRequestsPage() {
  await requireRole("ADMIN", "RECRUITER");
  const requests = await prisma.serviceRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { User: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
  });

  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><span className="professional-eyebrow">ATENDIMENTO</span><h1>Pedidos de clientes</h1><p>Reveja as necessidades recebidas e atualize o respetivo acompanhamento.</p></div><span className="admin-total">{requests.length} pedidos</span></header>
      <section className="admin-document-list">
        {requests.length === 0 ? <article className="professional-form-card"><h2>Sem pedidos</h2><p>Os pedidos enviados pelos clientes aparecerão aqui.</p></article> :
          requests.map((request) => (
            <article className="admin-document-card" key={request.id}>
              <div className="admin-document-info">
                <span className="card-label">{request.serviceType.replaceAll("_", " ")} · {request.location ?? "Sem localização"}</span>
                <h2>{request.title}</h2>
                <p>{request.User.firstName} {request.User.lastName} · {request.User.email} · {request.User.phone ?? "Sem telefone"}</p>
                <p>{request.description}</p>
                {request.preferredStartDate && <p>Data pretendida: {request.preferredStartDate.toLocaleDateString("pt-PT")}</p>}
                <time dateTime={request.createdAt.toISOString()}>{request.createdAt.toLocaleString("pt-PT")}</time>
              </div>
              <RecordStatusForm endpoint="/api/admin/pedidos" recordId={request.id} currentStatus={request.status} statuses={requestStatuses} />
            </article>
          ))}
      </section>
    </main>
  );
}
