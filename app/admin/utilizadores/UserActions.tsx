"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Action = "activate" | "block" | "suspend";

export default function UserActions({
  userId,
  userName,
  status,
  canDelete,
  adminCanChange,
}: {
  userId: string;
  userName: string;
  status: string;
  canDelete: boolean;
  adminCanChange: boolean;
}) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [suspendedUntil, setSuspendedUntil] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/utilizadores/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason,
          ...(action === "suspend" && suspendedUntil
            ? { suspendedUntil: new Date(suspendedUntil).toISOString() }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar a conta.");
      setAction(null);
      setReason("");
      setSuspendedUntil("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro.");
    } finally {
      setBusy(false);
    }
  }

  async function permanentlyDelete() {
    if (!canDelete) return;
    if (!window.confirm(`Eliminar permanentemente a conta de ${userName} e os respetivos dados? Esta ação não pode ser anulada.`)) return;
    if (window.prompt(`Escreva ELIMINAR para confirmar a eliminação de ${userName}.`) !== "ELIMINAR") return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/utilizadores/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "ELIMINAR" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível eliminar a conta.");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Ocorreu um erro.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-user-actions">
      {status !== "ACTIVE" ? (
        <button type="button" className="admin-action-button" disabled={!adminCanChange || busy} onClick={() => setAction("activate")}>Reativar</button>
      ) : (
        <>
          <button type="button" className="admin-action-button" disabled={!adminCanChange || busy} onClick={() => setAction("block")}>Bloquear</button>
          <button type="button" className="admin-action-button" disabled={!adminCanChange || busy} onClick={() => setAction("suspend")}>Suspender</button>
        </>
      )}
      {canDelete && <button type="button" className="admin-action-button danger" disabled={busy} onClick={permanentlyDelete}>Eliminar</button>}

      {action && (
        <dialog open className="admin-dialog">
          <form onSubmit={updateStatus}>
            <h2>{action === "activate" ? "Reativar conta" : action === "block" ? "Bloquear conta" : "Suspender conta"}</h2>
            <p>{userName}</p>
            <label>
              Motivo
              <textarea required minLength={5} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
            {action === "suspend" && (
              <label>
                Fim da suspensão (opcional)
                <input type="datetime-local" value={suspendedUntil} onChange={(event) => setSuspendedUntil(event.target.value)} />
              </label>
            )}
            {error && <p className="professional-form-error" role="alert">{error}</p>}
            <div className="admin-dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setAction(null)}>Cancelar</button>
              <button type="submit" className="primary-button" disabled={busy}>{busy ? "A guardar..." : "Confirmar"}</button>
            </div>
          </form>
        </dialog>
      )}
      {error && !action && <p className="professional-form-error" role="alert">{error}</p>}
    </div>
  );
}
