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

          <h2>Como funciona?</h2>

          <p>
            Tornamos o processo de encontrar profissionais mais organizado e
            transparente.
          </p>
        </div>

        <div className="asle-steps">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article className="asle-step" key={step.number}>
                <div className="asle-step-number">{step.number}</div>

                <div style={{ marginBottom: "15px" }}>
                  <Icon size={23} />
                </div>

                <h3>{step.title}</h3>

                <p>{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}