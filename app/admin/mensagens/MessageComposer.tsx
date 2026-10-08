"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Recipient = { id: string; firstName: string; lastName: string; email: string; role: string };

export default function MessageComposer({ recipients }: { recipients: Recipient[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const formElement = event.currentTarget;
    try {
      const response = await fetch("/api/admin/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(formElement).entries())),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar a mensagem.");
      formElement.reset();
      setSuccess("Mensagem enviada e notificação criada.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="professional-form-card admin-job-form" onSubmit={submit}>
      <h2>Nova mensagem</h2>
      <label>Destinatário<select name="recipientId" required defaultValue=""><option value="" disabled>Selecione</option>{recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.firstName} {recipient.lastName} · {recipient.email} ({recipient.role})</option>)}</select></label>
      <label>Assunto (opcional)<input name="subject" maxLength={150} /></label>
      <label>Mensagem<textarea name="body" required minLength={1} maxLength={5000} rows={5} /></label>
      {success && <p className="professional-form-success" role="status">{success}</p>}
      {error && <p className="professional-form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={saving || recipients.length === 0}>{saving ? "A enviar..." : "Enviar mensagem"}</button>
    </form>
  );
}
