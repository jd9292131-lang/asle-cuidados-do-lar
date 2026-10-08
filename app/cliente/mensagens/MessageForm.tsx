"use client";

import { FormEvent, useState } from "react";

export default function MessageForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formElement = event.currentTarget;
    try {
      const data = Object.fromEntries(new FormData(formElement).entries());
      const response = await fetch("/api/cliente/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível enviar a mensagem.");
      formElement.reset();
      setMessage("Mensagem enviada à equipa ASLE.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="professional-form-card admin-job-form" onSubmit={submit}>
      <h2>Escrever à ASLE</h2>
      <label>Assunto<input name="subject" maxLength={150} /></label>
      <label>Mensagem<textarea name="body" required maxLength={3000} rows={4} /></label>
      {message && <p className="professional-form-success" role="status">{message}</p>}
      {error && <p className="professional-form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={busy}>{busy ? "A enviar..." : "Enviar mensagem"}</button>
    </form>
  );
}
