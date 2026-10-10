import { ArrowRight, House, ShieldCheck } from "lucide-react";
import { getAsleWhatsAppUrl } from "@/lib/contact";

export default function ForFamilies() {
  return (
    <section className="asle-section asle-section-light">
      <div className="asle-container">
        <div className="asle-audience-grid">
          <article className="asle-audience-card asle-audience-family">
            <div className="asle-audience-card-copy">
              <div className="asle-audience-icon">
                <House size={23} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <span className="asle-audience-label">PARA FAMÍLIAS</span>
              <h3>Encontre apoio para o seu lar.</h3>
              <p>
                Conte-nos de que precisa. A nossa equipa ajuda a encontrar
                profissionais adequados à sua família.
              </p>
              <a
                href={getAsleWhatsAppUrl("Olá, preciso de ajuda para encontrar uma profissional para o meu lar.")}
                target="_blank"
                rel="noreferrer"
              >
                Falar com a ASLE
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="asle-audience-decoration" aria-hidden="true">
              <House size={116} strokeWidth={0.8} />
            </div>
          </article>

          <article id="profissionais" className="asle-audience-card asle-audience-professional">
            <div className="asle-audience-card-copy">
              <div className="asle-audience-icon">
                <ShieldCheck size={23} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <span className="asle-audience-label">PARA PROFISSIONAIS</span>
              <h3>O próximo passo da sua carreira começa aqui.</h3>
              <p>
                Crie o seu perfil e apresente a sua experiência à equipa de
                recrutamento ASLE.
              </p>
              <a href="/registar">
                Criar perfil profissional
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="asle-audience-decoration" aria-hidden="true">
              <ShieldCheck size={116} strokeWidth={0.8} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}