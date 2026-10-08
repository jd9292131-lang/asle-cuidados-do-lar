import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import ClientRequestForm from "./RequestForm";

const serviceLabels = {
  BABYSITTER: "Babá",
  DOMESTIC_WORKER: "Trabalhadora doméstica",
  COOK: "Cozinheira",
  CLEANER: "Limpeza",
  CAREGIVER: "Cuidadora",
  OTHER: "Outro serviço",
} as const;

const statusLabels = {
  DRAFT: "Rascunho",
  SUBMITTED: "Enviado",
  IN_REVIEW: "Em análise",
  MATCHING: "A procurar profissionais",
  PROPOSED: "Proposta enviada",
  ACCEPTED: "Aceite",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
} as const;

export default async function ClientDashboardPage() {
  const user = await requireRole("CLIENT");
  const client = await prisma.client.findUnique({
    where: { userId: user.id },
    include: {
      ServiceRequest: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) redirect("/registar");

  return (
    <main className="client-page">
      <header className="client-page-header">
        <div>
          <span className="professional-eyebrow">ÁREA DO CLIENTE</span>
          <h1>Olá, {user.firstName}</h1>
          <p>Conte-nos de que apoio precisa e acompanhe os seus pedidos.</p>
        </div>
        <Link href="/" className="secondary-button">Voltar ao site</Link>
      </header>
      <nav className="client-dashboard-links" aria-label="Área do cliente">
        <Link href="/cliente/mensagens">Mensagens</Link>
        <Link href="/cliente/notificacoes">Notificações</Link>
      </nav>

      <section className="client-dashboard-grid">
        <div className="client-panel">
          <span className="card-label">NOVO PEDIDO</span>
          <h2>Encontre apoio para o seu lar</h2>
          <p>Descreva o serviço de que precisa. A equipa ASLE entrará em contacto consigo.</p>
          <ClientRequestForm city={client.city ?? ""} />
        </div>

        <div className="client-panel">
          <span className="card-label">OS MEUS PEDIDOS</span>
          <h2>Acompanhamento</h2>
          {client.ServiceRequest.length === 0 ? (
            <p>Ainda não tem pedidos. Preencha o formulário para começar.</p>
          ) : (
            <div className="client-request-list">
              {client.ServiceRequest.map((serviceRequest) => (
                <article className="client-request-item" key={serviceRequest.id}>
                  <div className="client-request-heading">
                    <h3>{serviceRequest.title}</h3>
                    <span>{statusLabels[serviceRequest.status]}</span>
                  </div>
                  <p>{serviceLabels[serviceRequest.serviceType]} · {serviceRequest.location ?? "Localização não indicada"}</p>
                  <time dateTime={serviceRequest.createdAt.toISOString()}>
                    Pedido enviado em {serviceRequest.createdAt.toLocaleDateString("pt-PT")}
                  </time>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
