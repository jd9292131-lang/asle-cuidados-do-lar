"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function JobCreateForm({
  clients,
}: {
  clients: Array<{ id: string; name: string; email: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível criar a vaga.");
      event.currentTarget.reset();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="professional-form-card admin-job-form" onSubmit={submit}>
      <h2>Criar vaga</h2>
      {clients.length === 0 ? <p>Crie primeiro uma conta de cliente para associar a vaga.</p> : <>
        <label>Cliente<select name="clientId" required defaultValue=""><option value="" disabled>Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.email}</option>)}</select></label>
        <label>Título<input name="title" minLength={4} maxLength={150} required /></label>
        <label>Tipo de serviço<select name="serviceType" defaultValue="DOMESTIC_WORKER"><option value="BABYSITTER">Babá</option><option value="DOMESTIC_WORKER">Trabalho doméstico</option><option value="COOK">Cozinha</option><option value="CLEANER">Limpeza</option><option value="CAREGIVER">Cuidados</option><option value="OTHER">Outro</option></select></label>
        <label>Localização<input name="location" maxLength={200} /></label>
        <label>Descrição<textarea name="description" minLength={10} maxLength={5000} required rows={4} /></label>
        <label>Publicação<select name="status" defaultValue="DRAFT"><option value="DRAFT">Guardar como rascunho</option><option value="PUBLISHED">Publicar já</option></select></label>
        {error && <p className="professional-form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={saving}>{saving ? "A guardar..." : "Criar vaga"}</button>
      </>}
    </form>
  );
}
