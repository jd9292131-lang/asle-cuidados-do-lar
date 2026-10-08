import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import RecordStatusForm from "../RecordStatusForm";
import JobCreateForm from "./JobCreateForm";

const jobStatuses = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "PUBLISHED", label: "Publicada" },
  { value: "PAUSED", label: "Pausada" },
  { value: "CLOSED", label: "Encerrada" },
  { value: "ARCHIVED", label: "Arquivada" },
];

export default async function AdminJobsPage() {
  await requireRole("ADMIN", "RECRUITER");
  const [jobs, clients] = await Promise.all([
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, _count: { select: { applications: true } } },
    }),
    prisma.client.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } }),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><span className="professional-eyebrow">RECRUTAMENTO</span><h1>Vagas e candidaturas</h1><p>Publique oportunidades e acompanhe as candidaturas recebidas.</p></div><Link className="secondary-button" href="/admin/candidaturas">Ver candidaturas</Link></header>
      <section className="admin-operations-layout">
        <JobCreateForm clients={clients.map(({ id, user }) => ({ id, name: `${user.firstName} ${user.lastName}`, email: user.email }))} />
        <div className="admin-job-list">
          {jobs.length === 0 ? <article className="professional-form-card"><h2>Sem vagas</h2><p>Crie uma vaga para iniciar o recrutamento.</p></article> :
            jobs.map((job) => (
              <article className="professional-form-card admin-job-card" key={job.id}>
                <div className="admin-document-info">
                  <span className="card-label">{job.serviceType.replaceAll("_", " ")} · {job.location ?? "Sem localização"}</span>
                  <h2>{job.title}</h2>
                  <p>{job.client.user.firstName} {job.client.user.lastName} · {job.client.user.email}</p>
                  <p>{job.description}</p>
                  <small>{job._count.applications} candidaturas</small>
                </div>
                <RecordStatusForm endpoint="/api/admin/vagas" recordId={job.id} currentStatus={job.status} statuses={jobStatuses} />
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
