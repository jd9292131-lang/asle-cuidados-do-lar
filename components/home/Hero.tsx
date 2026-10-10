import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getAsleWhatsAppUrl } from "@/lib/contact";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Perfis analisados",
    description: "Seleção feita com atenção",
  },
  {
    icon: HeartHandshake,
    title: "Apoio próximo",
    description: "A equipa acompanha o processo",
  },
  {
    icon: ClipboardCheck,
    title: "Processo organizado",
    description: "Cada etapa com mais clareza",
  },
];

const processSteps = [
  "Partilhamos as suas necessidades",
  "A equipa procura perfis adequados",
  "Acompanhamos os próximos passos",
];

export default function Hero() {
  return (
    <section className="asle-hero">
      <div className="asle-container">
        <div className="asle-hero-inner">
          <div className="asle-hero-content">
            <div className="asle-eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              Cuidado pensado para cada lar
            </div>

            <h1>
              O cuidado começa
              <br />
              <span>com confiança.</span>
            </h1>

            <p className="asle-hero-description">
              Aproximamos famílias de profissionais selecionados para o
              cuidado do lar, com acompanhamento atento em cada etapa.
            </p>

            <div className="asle-hero-actions">
              <a
                href={getAsleWhatsAppUrl(
                  "Olá, gostaria de encontrar uma profissional para o meu lar."
                )}
                target="_blank"
                rel="noreferrer"
                className="asle-btn asle-btn-primary asle-btn-large"
              >
                <MessageCircle size={17} aria-hidden="true" />
                Encontrar profissional
                <ArrowRight size={17} aria-hidden="true" />
              </a>

              <a
                href="#profissionais"
                className="asle-btn asle-btn-outline asle-btn-large"
              >
                Quero trabalhar
              </a>
            </div>

            <div className="asle-hero-trust">
              <CheckCircle2 size={17} aria-hidden="true" />
              <span>Uma equipa presente do primeiro contacto em diante</span>
            </div>
          </div>

          <div className="asle-hero-visual" aria-label="Como a ASLE acompanha o processo">
            <div className="asle-hero-orbit asle-hero-orbit-one" />
            <div className="asle-hero-orbit asle-hero-orbit-two" />

            <article className="asle-process-card">
              <div className="asle-process-card-top">
                <span className="asle-process-symbol">
                  <Search size={18} aria-hidden="true" />
                </span>
                <span className="asle-process-label">COMO COMEÇAMOS</span>
                <span className="asle-process-status">Simples e acompanhado</span>
              </div>

              <h2>Encontrar apoio pode ser mais simples.</h2>
              <p className="asle-process-description">
                Conhecemos o que procura e ajudamos a encontrar um perfil
                adequado às necessidades do seu lar.
              </p>

              <ol className="asle-process-list">
                {processSteps.map((step, index) => (
                  <li key={step}>
                    <span className="asle-process-step-number">
                      {index < 2 ? (
                        <Check size={14} aria-hidden="true" />
                      ) : (
                        "03"
                      )}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="asle-process-card-footer">
                <span className="asle-process-footer-mark">A</span>
                <span>ASLE <small>Cuidados do Lar</small></span>
                <span className="asle-process-footer-rule" />
                <span className="asle-process-footer-caption">Cuidado com confiança</span>
              </div>
            </article>
          </div>
        </div>

        <div className="asle-trust-strip" aria-label="Compromissos ASLE">
          {trustPoints.map(({ icon: Icon, title, description }) => (
            <div className="asle-trust-point" key={title}>
              <span className="asle-trust-icon">
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
