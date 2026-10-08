import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function ProfissionalDashboard() {
  const user = await requireRole("CANDIDATE");

  const candidate = await prisma.candidate.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      professionalTitle: true,
      city: true,
      availability: true,
      yearsExperience: true,
      bio: true,
    },
  });

  if (!candidate) {
    redirect("/registar");
  }

  const profileFields = [
    candidate.professionalTitle,
    candidate.city,
    candidate.availability,
    candidate.yearsExperience !== null,
    candidate.bio,
  ];

  const completedFields = profileFields.filter(Boolean).length;
  const profileProgress = Math.round(
    (completedFields / profileFields.length) * 100
  );

  return (
    <main className="professional-dashboard">
      <header className="professional-header">
        <div>
          <span className="professional-eyebrow">
            ÁREA PROFISSIONAL
          </span>

          <h1>
            Olá, {user.firstName}
          </h1>

          <p>
            Bem-vinda à sua área profissional da ASLE.
          </p>
        </div>

        <div className="professional-status">
          <span className="status-dot" />
          Candidatura em análise
        </div>
      </header>

      <section className="professional-grid">
        <article className="professional-card professional-card-main">
          <div className="card-icon">👤</div>

          <div>
            <span className="card-label">PERFIL PROFISSIONAL</span>

            <h2>
              Complete o seu perfil
            </h2>

            <p>
              Quanto mais completo estiver o seu perfil,
              melhor poderemos avaliar as oportunidades
              adequadas ao seu perfil profissional.
            </p>
          </div>

          <div className="progress-area">
            <div className="progress-header">
              <span>Perfil completo</span>
              <strong>{profileProgress}%</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-value"
                style={{ width: `${profileProgress}%` }}
              />
            </div>
          </div>

          <Link href="/profissional/perfil" className="primary-button">
            Completar perfil
          </Link>
        </article>

        <article className="professional-card">
          <div className="card-icon">📄</div>

          <span className="card-label">
            DOCUMENTOS
          </span>

          <h2>
            Os seus documentos
          </h2>

          <p>
            Envie o seu documento de identificação,
            currículo e certificados profissionais.
          </p>

          <Link href="/profissional/documentos" className="secondary-button">
            Gerir documentos
          </Link>
        </article>

        <article className="professional-card">
          <div className="card-icon">💼</div>

          <span className="card-label">
            OPORTUNIDADES
          </span>

          <h2>
            Vagas disponíveis
          </h2>

          <p>
            Consulte oportunidades compatíveis com
            o seu perfil e disponibilidade.
          </p>

          <Link href="/profissional/oportunidades" className="secondary-button">
            Ver oportunidades
          </Link>
        </article>

        <article className="professional-card">
          <div className="card-icon">📅</div>

          <span className="card-label">
            ENTREVISTAS
          </span>

          <h2>
            Próximas entrevistas
          </h2>

          <p>
            Aqui aparecerão as entrevistas agendadas
            pela equipa de recrutamento da ASLE.
          </p>

          <Link href="/profissional/entrevistas" className="secondary-button">
            Ver entrevistas
          </Link>
        </article>
      </section>

      <section className="professional-welcome">
        <div>
          <span className="professional-eyebrow">
            ASLE — CUIDADOS DO LAR
          </span>

          <h2>
            O seu próximo trabalho pode começar aqui.
          </h2>

          <p>
            Mantenha os seus dados e documentos atualizados
            para que a nossa equipa possa encontrar
            oportunidades adequadas ao seu perfil.
          </p>
        </div>
      </section>
    </main>
  );
}