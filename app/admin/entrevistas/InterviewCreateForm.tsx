"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CandidateOption = {
  id: string;
  name: string;
  email: string;
  applications: Array<{ id: string; title: string }>;
};

export default function InterviewCreateForm({ candidates }: { candidates: CandidateOption[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-PT");
    if (!query) return candidates;
    return candidates.filter((candidate) =>
      `${candidate.name} ${candidate.email}`.toLocaleLowerCase("pt-PT").includes(query),
    );
  }, [candidates, search]);
  const selectedCandidate = candidates.find((candidate) => candidate.id === candidateId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.scheduledAt = new Date(String(data.scheduledAt)).toISOString();
      if (!data.applicationId) delete data.applicationId;

      const response = await fetch("/api/admin/entrevistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível agendar a entrevista.");
      form.reset();
      setSearch("");
      setCandidateId("");
      setApplicationId("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="professional-form-card admin-job-form" onSubmit={submit}>
      <h2>Agendar entrevista</h2>
      {candidates.length === 0 ? <p>Não existem perfis profissionais disponíveis.</p> : <>
        <label>
          Pesquisar profissional
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou e-mail"
            aria-label="Pesquisar profissional por nome ou e-mail"
          />
        </label>
        <p className="admin-picker-count" aria-live="polite">
          {filteredCandidates.length} de {candidates.length} profissionais
        </p>
        <label>Profissional<select name="candidateId" required value={candidateId} onChange={(event) => {
          setCandidateId(event.target.value);
          setApplicationId("");
        }}>
          <option value="" disabled>Selecione</option>
          {selectedCandidate && !filteredCandidates.some((candidate) => candidate.id === selectedCandidate.id) && (
            <option value={selectedCandidate.id}>{selectedCandidate.name} · {selectedCandidate.email}</option>
          )}
          {filteredCandidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.email}</option>)}
        </select></label>
        {filteredCandidates.length === 0 && <p role="status">Não foram encontrados profissionais com esse nome ou e-mail.</p>}
        <label>Candidatura (opcional)<select name="applicationId" value={applicationId} onChange={(event) => setApplicationId(event.target.value)} disabled={!selectedCandidate}>
          <option value="">Entrevista geral</option>
          {selectedCandidate?.applications.map((application) => <option key={application.id} value={application.id}>{application.title}</option>)}
        </select></label>
        <label>Data e hora<input type="datetime-local" name="scheduledAt" required /></label>
        <label>Local ou ligação<input name="location" maxLength={300} /></label>
        <label>Notas<textarea name="notes" maxLength={2000} rows={3} /></label>
        {error && <p className="professional-form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={saving}>{saving ? "A agendar..." : "Agendar entrevista"}</button>
      </>}
    </form>
  );
}
