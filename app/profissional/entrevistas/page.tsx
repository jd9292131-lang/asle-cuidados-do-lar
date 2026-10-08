import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const statusLabels = {
  SCHEDULED: "Agendada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  NO_SHOW: "Não compareceu",
} as const;

export default async function InterviewsPage() {
  const user = await requireRole("CANDIDATE");
  const interviews = await prisma.interview.findMany({
    where: { Candidate: { userId: user.id } },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      scheduledAt: true,
      location: true,
      notes: true,
      status: true,
      Application: { select: { job: { select: { title: true } } } },
    },
  });

  return (
    <main className="professional-page">
      <header className="professional-page-header">
        <div>
          <span className="professional-eyebrow">ÁREA PROFISSIONAL</span>
          <h1>Entrevistas</h1>
          <p>Consulte as entrevistas agendadas pela equipa ASLE.</p>
        </div>
      </header>

      {interviews.length === 0 ? (
        <section className="professional-form-card">
          <h2>Não tem entrevistas agendadas</h2>
          <p>Se for selecionada para uma entrevista, os detalhes aparecerão nesta página.</p>
        </section>
      ) : (
        <div className="professional-list">
          {interviews.map((interview) => (
            <article className="professional-form-card" key={interview.id}>
              <div className="client-request-heading">
                <h2>{interview.Application?.job.title ?? "Entrevista ASLE"}</h2>
                <span>{statusLabels[interview.status]}</span>
              </div>
              <p>{interview.scheduledAt.toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" })}</p>
              {interview.location && <p>Local: {interview.location}</p>}
              {interview.notes && <p>{interview.notes}</p>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
