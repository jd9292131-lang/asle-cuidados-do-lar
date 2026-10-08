import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import DocumentsPanel from "./DocumentsPanel";

export default async function DocumentsPage() {
  const user = await requireRole("CANDIDATE");
  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      originalName: true,
      sizeBytes: true,
      rejectionReason: true,
      uploadedAt: true,
    },
  });

  return (
    <main className="professional-page">
      <header className="professional-page-header">
        <div>
          <span className="professional-eyebrow">ÁREA PROFISSIONAL</span>
          <h1>Os meus documentos</h1>
          <p>Envie os documentos necessários para a equipa ASLE analisar a sua candidatura.</p>
        </div>
      </header>
      <DocumentsPanel
        initialDocuments={documents.map((document) => ({
          ...document,
          uploadedAt: document.uploadedAt.toISOString(),
        }))}
      />
    </main>
  );
}
