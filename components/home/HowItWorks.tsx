import {
  ClipboardCheck,
  Search,
  UserCheck,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Conte-nos o que precisa",
    description:
      "Defina o tipo de profissional, serviço e requisitos que procura.",
  },
  {
    number: "02",
    icon: Search,
    title: "Encontramos os perfis",
    description:
      "A ASLE analisa os profissionais disponíveis de acordo com a necessidade.",
  },
  {
    number: "03",
    icon: UserCheck,
    title: "Escolha com confiança",
    description:
      "Conheça o perfil adequado e avance com o processo de contratação.",
  },
];

export default function HowItWorks() {
  return (
    <section className="asle-section">
      <div className="asle-container">
        <div className="asle-section-heading">
          <div className="asle-eyebrow">Processo simples</div>

          <h2>Um processo claro, do primeiro contacto em diante.</h2>

          <p>
            A equipa ASLE ajuda a organizar cada passo para que saiba sempre
            como avançar.
          </p>
        </div>

        <div className="asle-steps">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article className="asle-step" key={step.number}>
                <div className="asle-step-heading">
                  <span className="asle-step-number">{step.number}</span>
                  <span className="asle-step-icon">
                    <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < steps.length - 1 && (
                  <span className="asle-step-connector" aria-hidden="true" />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}