import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="asle-hero">
      <div className="asle-container asle-hero-inner">
        <div className="asle-hero-content">
          <div className="asle-eyebrow">
            <BriefcaseBusiness size={14} />
            Cuidados do lar
          </div>

          <h1>
            Pessoas certas.
            <br />
            <span>Cuidados melhores.</span>
          </h1>

          <p className="asle-hero-description">
            A ASLE conecta famílias e clientes a profissionais selecionados
            para serviços domésticos e cuidados do lar, com mais confiança,
            segurança e profissionalismo.
          </p>

          <div className="asle-hero-actions">
            <a
              href="#servicos"
              className="asle-btn asle-btn-primary asle-btn-large"
            >
              Encontrar profissional
              <ArrowRight size={18} />
            </a>

            <a
              href="#profissionais"
              className="asle-btn asle-btn-outline asle-btn-large"
            >
              Quero trabalhar
            </a>
          </div>

          <div className="asle-hero-trust">
            <CheckCircle2 size={17} />
            Recrutamento e seleção com acompanhamento da ASLE
          </div>
        </div>

        <div className="asle-hero-visual">
          <div className="asle-hero-card">
            <div className="asle-hero-card-content">
              <div className="asle-hero-card-icon">
                <BriefcaseBusiness size={31} />
              </div>

              <div>
                <h2>
                  Cuidar começa
                  <br />
                  com confiança.
                </h2>

                <p>
                  Uma plataforma pensada para aproximar profissionais e
                  famílias de forma simples e profissional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}