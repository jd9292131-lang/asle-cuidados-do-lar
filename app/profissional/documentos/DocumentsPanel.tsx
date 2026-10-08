"use client";

import { FormEvent, useState } from "react";

export type CandidateDocument = {
  id: string;
  type: string;
  status: string;
  originalName: string;
  sizeBytes: number;
  rejectionReason: string | null;
  uploadedAt: string;
};

const typeLabels: Record<string, string> = {
  ID_CARD: "Bilhete de identidade",
  PASSPORT: "Passaporte",
  RESUME: "Currículo",
  CERTIFICATE: "Certificado",
  OTHER: "Outro documento",
};

const statusLabels: Record<string, string> = {
  PENDING: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  EXPIRED: "Expirado",
};

export default function DocumentsPanel({
  initialDocuments,
}: {
  initialDocuments: CandidateDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    const response = await fetch("/api/profissional/documentos");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os documentos.");
    setDocuments(data.documents);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData(formElement);
      const response = await fetch("/api/profissional/documentos", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar o documento.");

      formElement.reset();
      await loadDocuments();
      setMessage("Documento enviado para análise.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Ocorreu um erro ao enviar o documento.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="documents-layout">
      <form className="professional-form-card document-upload-form" onSubmit={handleSubmit}>
        <span className="card-label">NOVO DOCUMENTO</span>
        <h2>Enviar documento</h2>
        <p>Envie PDF, JPG ou PNG até 10 MB. Os documentos ficam guardados em armazenamento privado.</p>
        <label className="professional-field">
          Tipo de documento
          <select name="type" required defaultValue="">
            <option value="" disabled>Selecione</option>
            {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="professional-field">
          Ficheiro
          <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required />
        </label>
        {message && <p className="professional-form-success" role="status">{message}</p>}
        {error && <p className="professional-form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={uploading}>
          {uploading ? "A enviar..." : "Enviar para análise"}
        </button>
      </form>

      <section className="professional-form-card">
        <span className="card-label">OS MEUS DOCUMENTOS</span>
        <h2>Estado dos documentos</h2>
        {documents.length === 0 ? (
          <p>Ainda não enviou documentos.</p>
        ) : (
          <div className="client-request-list">
            {documents.map((document) => (
              <article className="client-request-item" key={document.id}>
                <div className="client-request-heading">
                  <h3>{typeLabels[document.type] ?? document.type}</h3>
                  <span>{statusLabels[document.status] ?? document.status}</span>
                </div>
                <p>{document.originalName} · {(document.sizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
                {document.rejectionReason && <p className="professional-form-error">{document.rejectionReason}</p>}
                <time dateTime={document.uploadedAt}>Enviado em {new Date(document.uploadedAt).toLocaleDateString("pt-PT")}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
