import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
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

  const profileItems = [
    { label: "Título profissional", complete: Boolean(candidate.professionalTitle) },
    { label: "Localização", complete: Boolean(candidate.city) },
    { label: "Disponibilidade", complete: Boolean(candidate.availability) },
    { label: "Experiência", complete: candidate.yearsExperience !== null },
    { label: "Apresentação", complete: Boolean(candidate.bio) },
  ];
  const completedFields = profileItems.filter((item) => item.complete).length;
  const profileProgress = Math.round(
    (completedFields / profileItems.length) * 100
  );

  return (
    <main className="professional-dashboard">
      <header className="professional-header">
        <div>
          <span className="professional-eyebrow">A SUA ÁREA PROFISSIONAL</span>
          <h1>Olá, {user.firstName}.</h1>
          <p>Acompanhe o seu perfil e os próximos passos com a ASLE.</p>
        </div>

        <div className="professional-status">
          <span className="status-dot" />
          Candidatura em análise
        </div>
      </header>

      <section className="professional-overview-grid">
        <article className="professional-profile-overview">
          <div className="professional-profile-overview-copy">
            <span className="professional-card-kicker">O SEU PERFIL</span>
            <h2>Um perfil completo ajuda-nos a conhecer melhor a sua experiência.</h2>
            <p>
              Atualize as suas informações para que a equipa ASLE possa avaliar
              o seu perfil para futuras oportunidades.
            </p>
            <Link href="/profissional/perfil" className="primary-button">
              Rever o meu perfil
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="professional-profile-progress">
            <div
              className="professional-progress-ring"
              style={{ "--profile-progress": `${profileProgress}%` } as CSSProperties}
              aria-label={`Perfil ${profileProgress}% completo`}
            >
              <span>
                <strong>{profileProgress}%</strong>
                <small>completo</small>
              </span>
            </div>
            <span className="professional-progress-caption">
              {completedFields} de {profileItems.length} informações preenchidas
            </span>
          </div>
        </article>

        <aside className="professional-checklist-card">
          <div className="professional-checklist-heading">
            <span className="professional-checklist-icon">
              <UserRound size={17} aria-hidden="true" />
            </span>
            <div>
              <span className="professional-card-kicker">PRÓXIMO PASSO</span>
              <h2>Complete o seu perfil</h2>
            </div>
          </div>

          <ul className="professional-checklist">
            {profileItems.map((item) => (
              <li key={item.label} className={item.complete ? "is-complete" : ""}>
                <span className="professional-checklist-mark">
                  {item.complete ? (
                    <Check size={13} aria-hidden="true" />
                  ) : (
                    <span />
                  )}
                </span>
                {item.label}
              </li>
            ))}
          </ul>

          <Link href="/profissional/perfil" className="professional-text-link">
            Atualizar informações
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </aside>
      </section>

      <section className="professional-shortcuts-section">
        <div className="professional-section-heading">
          <div>
            <span className="professional-card-kicker">ACESSO RÁPIDO</span>
            <h2>O que precisa de fazer?</h2>
          </div>
        </div>

        <div className="professional-shortcuts-grid">
          <Link href="/profissional/documentos" className="professional-shortcut">
            <span className="professional-shortcut-icon">
              <FileText size={19} aria-hidden="true" />
            </span>
            <span className="professional-shortcut-copy">
              <strong>Os meus documentos</strong>
              <small>Gerir identificação e certificados</small>
            </span>
            <ArrowUpRight size={17} className="professional-shortcut-arrow" aria-hidden="true" />
          </Link>

          <Link href="/profissional/oportunidades" className="professional-shortcut">
            <span className="professional-shortcut-icon">
              <BriefcaseBusiness size={19} aria-hidden="true" />
            </span>
            <span className="professional-shortcut-copy">
              <strong>Oportunidades</strong>
              <small>Consultar vagas disponíveis</small>
            </span>
            <ArrowUpRight size={17} className="professional-shortcut-arrow" aria-hidden="true" />
          </Link>

          <Link href="/profissional/entrevistas" className="professional-shortcut">
            <span className="professional-shortcut-icon">
              <CalendarDays size={19} aria-hidden="true" />
            </span>
            <span className="professional-shortcut-copy">
              <strong>Entrevistas</strong>
              <small>Acompanhar agendamentos</small>
            </span>
            <ArrowUpRight size={17} className="professional-shortcut-arrow" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="professional-status-panel">
        <span className="professional-status-panel-icon">
          <Clock3 size={20} aria-hidden="true" />
        </span>
        <div>
          <span className="professional-card-kicker">ACOMPANHAMENTO ASLE</span>
          <h2>A sua candidatura está em análise.</h2>
          <p>
            Mantenha os seus dados atualizados. A equipa ASLE entrará em
            contacto quando houver novidades sobre o seu processo.
          </p>
        </div>
      </section>
    </main>
  );
}
