import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import RecordStatusForm from "../RecordStatusForm";

const statuses = [
  { value: "SUBMITTED", label: "Recebida" },
  { value: "UNDER_REVIEW", label: "Em análise" },
  { value: "SHORTLISTED", label: "Pré-selecionada" },
  { value: "INTERVIEW", label: "Entrevista" },
  { value: "APPROVED", label: "Aprovada" },
  { value: "REJECTED", label: "Não selecionada" },
  { value: "WITHDRAWN", label: "Retirada" },
];

export default async function AdminApplicationsPage() {
  await requireRole("ADMIN", "RECRUITER");
  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      candidate: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
      job: { select: { id: true, title: true, status: true, location: true } },
    },
  });

  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><span className="professional-eyebrow">RECRUTAMENTO</span><h1>Candidaturas</h1><p>Reveja perfis e atualize o estado de cada candidatura.</p></div></header>
      <section className="admin-document-list">
        {applications.length === 0 ? <article className="professional-form-card"><h2>Sem candidaturas</h2><p>As candidaturas submetidas aparecerão aqui.</p></article> :
          applications.map((application) => (
            <article className="admin-document-card" key={application.id}>
              <div className="admin-document-info">
                <span className="card-label">{application.job.title} · {application.job.location ?? "Sem localização"}</span>
                <h2><a href={`/admin/utilizadores/${application.candidate.user.id}`}>{application.candidate.user.firstName} {application.candidate.user.lastName}</a></h2>
                <p>{application.candidate.user.email} · {application.candidate.user.phone ?? "Sem telefone"}</p>
                {application.candidate.professionalTitle && <p>{application.candidate.professionalTitle} · {application.candidate.city ?? ""}</p>}
                {application.coverLetter && <p>{application.coverLetter}</p>}
                <time dateTime={application.createdAt.toISOString()}>Candidatura enviada {application.createdAt.toLocaleString("pt-PT")}</time>
              </div>
              <RecordStatusForm endpoint="/api/admin/candidaturas" recordId={application.id} currentStatus={application.status} statuses={statuses} />
            </article>
          ))}
      </section>
    </main>
  );
}
