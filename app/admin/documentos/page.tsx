import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import DocumentReview from "./DocumentReview";

const typeLabels = {
  ID_CARD: "Bilhete de identidade",
  PASSPORT: "Passaporte",
  RESUME: "Currículo",
  CERTIFICATE: "Certificado",
  OTHER: "Outro",
} as const;

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN", "RECRUITER");
  const params = await searchParams;
  const status = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"].includes(params.status ?? "")
    ? params.status as "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED"
    : "PENDING";
  const documents = await prisma.document.findMany({
    where: { status },
    orderBy: { uploadedAt: "asc" },
    take: 100,
    select: {
      id: true,
      type: true,
      status: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      rejectionReason: true,
      uploadedAt: true,
      reviewedAt: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div><span className="professional-eyebrow">REVISÃO E CONFORMIDADE</span><h1>Documentos</h1><p>Aceda aos ficheiros de forma privada e registe a decisão de revisão.</p></div>
        <span className="admin-total">{documents.length} documentos</span>
      </header>
      <nav className="admin-filter-tabs" aria-label="Filtrar por estado">
        {[
          ["PENDING", "Pendentes"],
          ["APPROVED", "Aprovados"],
          ["REJECTED", "Rejeitados"],
          ["EXPIRED", "Expirados"],
        ].map(([value, label]) => <a className={status === value ? "active" : ""} href={`/admin/documentos?status=${value}`} key={value}>{label}</a>)}
      </nav>
      <section className="admin-document-list">
        {documents.length === 0 ? <article className="professional-form-card"><h2>Não há documentos neste estado</h2><p>Os documentos recebidos aparecerão aqui.</p></article> :
          documents.map((document) => (
            <article className="admin-document-card" key={document.id}>
              <div className="admin-document-info">
                <span className="card-label">{typeLabels[document.type]} · {document.status}</span>
                <h2>{document.originalName}</h2>
                <p><a href={`/admin/utilizadores/${document.user.id}`}>{document.user.firstName} {document.user.lastName}</a> · {document.user.email}</p>
                <p>{document.mimeType} · {(document.sizeBytes / (1024 * 1024)).toFixed(2)} MB · enviado {document.uploadedAt.toLocaleString("pt-PT")}</p>
                {document.rejectionReason && <p className="professional-form-error">Motivo: {document.rejectionReason}</p>}
              </div>
              <div className="admin-review-actions">
                <a className="secondary-button" href={`/api/admin/documentos/${document.id}/ficheiro`}>Transferir em segurança</a>
                {status === "PENDING" && <DocumentReview id={document.id} />}
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}
