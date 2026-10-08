"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RecordStatusForm({
  endpoint,
  recordId,
  currentStatus,
  statuses,
  notes,
}: {
  endpoint: string;
  recordId: string;
  currentStatus: string;
  statuses: Array<{ value: string; label: string }>;
  notes?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === currentStatus) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordId, status, ...(notes ? { notes } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar o estado.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-status-form" onSubmit={submit}>
      <select aria-label="Estado" value={status} onChange={(event) => setStatus(event.target.value)}>
        {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <button className="admin-action-button" type="submit" disabled={saving || status === currentStatus}>
        {saving ? "A guardar..." : "Atualizar"}
      </button>
      {error && <span className="professional-form-error" role="alert">{error}</span>}
    </form>
  );
}
