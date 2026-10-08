"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffAccountForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/admin/equipa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível criar a conta.");

      form.reset();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="professional-form-card admin-job-form" onSubmit={submit}>
      <h2>Criar conta da equipa</h2>
      <p>A conta fica ativa de imediato. Defina uma palavra-passe exclusiva e entregue-a ao titular por um canal seguro.</p>
      <div className="admin-form-grid">
        <label>
          Nome
          <input name="firstName" autoComplete="given-name" minLength={2} maxLength={80} required />
        </label>
        <label>
          Apelido
          <input name="lastName" autoComplete="family-name" minLength={2} maxLength={80} required />
        </label>
        <label>
          E-mail
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>
          Telefone (opcional)
          <input name="phone" type="tel" autoComplete="tel" maxLength={30} />
        </label>
        <label>
          Perfil de acesso
          <select name="role" defaultValue="RECRUITER" required>
            <option value="RECRUITER">Recrutador</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>
        <label>
          Palavra-passe inicial (mínimo 14 caracteres)
          <input name="password" type="password" autoComplete="new-password" minLength={14} maxLength={72} required />
        </label>
        <label>
          Confirmar palavra-passe
          <input name="confirmPassword" type="password" autoComplete="new-password" minLength={14} maxLength={72} required />
        </label>
      </div>
      {error && <p className="professional-form-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "A criar conta..." : "Criar conta"}
      </button>
    </form>
  );
}
