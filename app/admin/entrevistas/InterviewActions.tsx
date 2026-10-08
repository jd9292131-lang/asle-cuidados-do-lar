"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InterviewActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(nextStatus: "COMPLETED" | "CANCELLED") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/entrevistas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar a entrevista.");
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Ocorreu um erro.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-user-actions">
      {status === "SCHEDULED" && <>
        <button className="admin-action-button" type="button" disabled={busy} onClick={() => void update("COMPLETED")}>Concluir</button>
        <button className="admin-action-button danger" type="button" disabled={busy} onClick={() => void update("CANCELLED")}>Cancelar</button>
      </>}
      {error && <span className="professional-form-error" role="alert">{error}</span>}
    </div>
  );
}
