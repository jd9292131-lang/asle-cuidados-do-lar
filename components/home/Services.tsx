import {
  Baby,
  Home,
  HeartHandshake,
} from "lucide-react";

const services = [
  {
    icon: Baby,
    title: "Babás",
    description:
      "Profissionais para acompanhamento e cuidados de crianças, com atenção, responsabilidade e dedicação.",
  },
  {
    icon: Home,
    title: "Profissionais domésticas",
    description:
      "Encontre profissionais para limpeza, organização e manutenção das tarefas do lar.",
  },
  {
    icon: HeartHandshake,
    title: "Cuidados personalizados",
    description:
      "Soluções de recrutamento adaptadas às necessidades específicas de cada família ou cliente.",
  },
];

export default function Services() {
  return (
    <section id="servicos" className="asle-section asle-section-light">
      <div className="asle-container">
        <div className="asle-section-heading">
          <div className="asle-eyebrow">O que fazemos</div>

          <h2>Soluções para cuidar melhor do seu lar.</h2>

          <p>
            Um ponto de partida simples para encontrar o apoio que a sua
            família precisa.
          </p>
        </div>

        <div className="asle-services-grid">
          {services.map((service, index) => {
            const Icon = service.icon;

            return (
              <article className="asle-service-card" key={service.title}>
                <div className="asle-service-card-top">
                  <div className="asle-service-icon">
                    <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <span className="asle-service-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="asle-service-card-copy">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}