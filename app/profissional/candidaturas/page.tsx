import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const statusLabels = {
  SUBMITTED: "Enviada",
  UNDER_REVIEW: "Em análise",
  SHORTLISTED: "Pré-selecionada",
  INTERVIEW: "Entrevista",
  APPROVED: "Aprovada",
  REJECTED: "Não selecionada",
  WITHDRAWN: "Retirada",
} as const;

export default async function ApplicationsPage() {
  const user = await requireRole("CANDIDATE");
  const candidate = await prisma.candidate.findUnique({
    where: { userId: user.id },
    select: {
      applications: {
        orderBy: { createdAt: "desc" },
        include: { job: { select: { title: true, location: true, serviceType: true } } },
      },
    },
  });

  return (
    <main className="professional-page">
      <header className="professional-page-header">
        <div>
          <span className="professional-eyebrow">ÁREA PROFISSIONAL</span>
          <h1>As minhas candidaturas</h1>
          <p>Acompanhe o estado das oportunidades a que se candidatou.</p>
        </div>
      </header>

      {!candidate?.applications.length ? (
        <section className="professional-form-card">
          <h2>Ainda não enviou candidaturas</h2>
          <p>Quando se candidatar a uma oportunidade publicada, poderá acompanhar o processo aqui.</p>
        </section>
      ) : (
        <div className="professional-list">
          {candidate.applications.map((application) => (
            <article className="professional-form-card" key={application.id}>
              <div className="client-request-heading">
                <h2>{application.job.title}</h2>
                <span>{statusLabels[application.status]}</span>
              </div>
              <p>{application.job.location ?? "Localização a confirmar"}</p>
              <time dateTime={application.createdAt.toISOString()}>
                Enviada em {application.createdAt.toLocaleDateString("pt-PT")}
              </time>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
