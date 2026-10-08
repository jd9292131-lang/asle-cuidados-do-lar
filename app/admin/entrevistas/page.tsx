import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import InterviewCreateForm from "./InterviewCreateForm";
import InterviewActions from "./InterviewActions";

export default async function AdminInterviewsPage() {
  await requireRole("ADMIN", "RECRUITER");
  const [candidates, interviews] = await Promise.all([
    prisma.candidate.findMany({
      orderBy: { user: { firstName: "asc" } },
      include: { user: { select: { firstName: true, lastName: true, email: true } }, applications: { include: { job: { select: { title: true } } } } },
    }),
    prisma.interview.findMany({
      orderBy: { scheduledAt: "asc" },
      take: 100,
      include: {
        Candidate: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        Application: { include: { job: { select: { title: true } } } },
      },
    }),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><span className="professional-eyebrow">RECRUTAMENTO</span><h1>Entrevistas</h1><p>Agende, consulte e atualize entrevistas. A profissional recebe notificação interna.</p></div></header>
      <section className="admin-operations-layout">
        <InterviewCreateForm candidates={candidates.map(({ id, user, applications }) => ({
          id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          applications: applications.map(({ id: applicationId, job }) => ({ id: applicationId, title: job.title })),
        }))} />
        <div className="admin-job-list">
          {interviews.length === 0 ? <article className="professional-form-card"><h2>Sem entrevistas</h2><p>As entrevistas agendadas aparecerão aqui.</p></article> :
            interviews.map((interview) => (
              <article className="professional-form-card admin-job-card" key={interview.id}>
                <span className="card-label">{interview.status}</span>
                <h2>{interview.Candidate.user.firstName} {interview.Candidate.user.lastName}</h2>
                <p>{interview.Candidate.user.email}</p>
                <p>{interview.Application?.job.title ?? "Entrevista geral"}</p>
                <p>{interview.scheduledAt.toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" })} · {interview.location ?? "Local a confirmar"}</p>
                {interview.notes && <p>{interview.notes}</p>}
                <InterviewActions id={interview.id} status={interview.status} />
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
