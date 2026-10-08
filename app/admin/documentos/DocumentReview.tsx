"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentReview({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(status: "APPROVED" | "REJECTED", reason?: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/documentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível rever o documento.");
      setRejecting(false);
      router.refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Ocorreu um erro.");
    } finally {
      setBusy(false);
    }
  }

  function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = new FormData(event.currentTarget).get("reason");
    if (typeof reason === "string") void submit("REJECTED", reason);
  }

  return (
    <div className="admin-review-actions">
      <button className="primary-button" type="button" disabled={busy} onClick={() => void submit("APPROVED")}>Aprovar</button>
      <button className="admin-action-button danger" type="button" disabled={busy} onClick={() => setRejecting(true)}>Rejeitar</button>
      {rejecting && (
        <dialog open className="admin-dialog">
          <form onSubmit={handleReject}>
            <h2>Rejeitar documento</h2>
            <label>Motivo<textarea name="reason" required minLength={5} maxLength={500} /></label>
            {error && <p className="professional-form-error" role="alert">{error}</p>}
            <div className="admin-dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setRejecting(false)}>Cancelar</button>
              <button type="submit" className="admin-action-button danger" disabled={busy}>{busy ? "A guardar..." : "Confirmar rejeição"}</button>
            </div>
          </form>
        </dialog>
      )}
      {error && !rejecting && <p className="professional-form-error" role="alert">{error}</p>}
    </div>
  );
}
