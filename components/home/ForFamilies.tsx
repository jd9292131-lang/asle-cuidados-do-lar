import {
  ArrowRight,
  House,
  ShieldCheck,
} from "lucide-react";

export default function ForFamilies() {
  return (
    <section className="asle-section asle-section-light">
      <div className="asle-container">
        <div className="asle-audience-grid">
          <article className="asle-audience-card">
            <div className="asle-audience-icon">
              <House size={27} />
            </div>

            <h3>Precisa de alguém para cuidar do seu lar?</h3>

            <p>
              Encontre profissionais adequados às necessidades da sua família
              através da ASLE.
            </p>

            <a href="#contacto">
              Encontrar profissional
              <ArrowRight size={17} />
            </a>
          </article>

          <article id="profissionais" className="asle-audience-card gold">
            <div className="asle-audience-icon">
              <ShieldCheck size={27} />
            </div>

            <h3>É profissional e procura uma oportunidade?</h3>

            <p>
              Registe o seu perfil e apresente as suas competências para novas
              oportunidades profissionais.
            </p>

            <a href="/registar">
              Criar perfil profissional
              <ArrowRight size={17} />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}