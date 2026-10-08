"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplyButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  async function apply() {
    setApplying(true);
    setError("");

    try {
      const response = await fetch("/api/profissional/candidaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar a candidatura.");
      router.push("/profissional/candidaturas");
      router.refresh();
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Ocorreu um erro ao candidatar-se.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <button className="primary-button" type="button" onClick={apply} disabled={applying}>
        {applying ? "A enviar..." : "Candidatar-me"}
      </button>
      {error && <p className="professional-form-error" role="alert">{error}</p>}
    </div>
  );
}
