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

          <h2>
            Soluções para o
            <br />
            cuidado do lar
          </h2>

          <p>
            Ajudamos clientes a encontrar profissionais adequados às suas
            necessidades.
          </p>
        </div>

        <div className="asle-services-grid">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article className="asle-service-card" key={service.title}>
                <div className="asle-service-icon">
                  <Icon size={26} strokeWidth={1.9} />
                </div>

                <h3>{service.title}</h3>

                <p>{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}