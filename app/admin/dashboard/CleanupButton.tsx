"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CleanupButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function retry() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/limpeza-armazenamento", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível repetir a limpeza.");
      setMessage(`Limpeza concluída: ${data.deleted} removidos, ${data.remaining} pendentes.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-cleanup-action"><button className="admin-action-button" type="button" disabled={busy} onClick={() => void retry()}>{busy ? "A limpar..." : "Tentar novamente"}</button>{message && <span role="status">{message}</span>}</div>;
}
