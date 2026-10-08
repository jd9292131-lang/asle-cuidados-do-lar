import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import ApplyButton from "./ApplyButton";

const serviceLabels = {
  BABYSITTER: "Babá",
  DOMESTIC_WORKER: "Trabalho doméstico",
  COOK: "Cozinha",
  CLEANER: "Limpeza",
  CAREGIVER: "Cuidados",
  OTHER: "Outro serviço",
} as const;

export default async function OpportunitiesPage() {
  const user = await requireRole("CANDIDATE");
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED", closedAt: null },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      serviceType: true,
      applications: {
        where: { candidate: { userId: user.id } },
        select: { id: true },
      },
    },
  });

  return (
    <main className="professional-page">
      <header className="professional-page-header">
        <div>
          <span className="professional-eyebrow">ÁREA PROFISSIONAL</span>
          <h1>Oportunidades</h1>
          <p>Consulte as vagas publicadas pela equipa ASLE.</p>
        </div>
      </header>

      {jobs.length === 0 ? (
        <section className="professional-form-card">
          <h2>Não há vagas publicadas neste momento</h2>
          <p>Atualize o seu perfil para que a equipa ASLE possa considerar a sua experiência em futuras oportunidades.</p>
        </section>
      ) : (
        <div className="professional-list">
          {jobs.map((job) => (
            <article className="professional-form-card" key={job.id}>
              <span className="card-label">{serviceLabels[job.serviceType]}</span>
              <h2>{job.title}</h2>
              <p>{job.location ?? "Localização a confirmar"}</p>
              <p className="professional-list-description">{job.description}</p>
              {job.applications.length > 0 ? (
                <span className="professional-form-success">Já enviou a sua candidatura.</span>
              ) : (
                <ApplyButton jobId={job.id} />
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
