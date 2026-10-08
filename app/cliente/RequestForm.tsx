"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const serviceTypes = [
  ["BABYSITTER", "Babá"],
  ["DOMESTIC_WORKER", "Trabalhadora doméstica"],
  ["COOK", "Cozinheira"],
  ["CLEANER", "Limpeza"],
  ["CAREGIVER", "Cuidadora"],
  ["OTHER", "Outro serviço"],
] as const;

export default function ClientRequestForm({ city }: { city: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setError("");
    setMessage("");

    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/cliente/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar o pedido.");

      formElement.reset();
      setMessage("Pedido enviado. A equipa ASLE irá analisá-lo.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro ao enviar o pedido.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="client-request-form" onSubmit={handleSubmit}>
      <label>
        Tipo de serviço
        <select name="serviceType" required defaultValue="">
          <option value="" disabled>Selecione um serviço</option>
          {serviceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Título do pedido
        <input name="title" required minLength={4} maxLength={120} placeholder="Ex.: Babá durante a semana" />
      </label>
      <label>
        Descrição
        <textarea name="description" required minLength={10} maxLength={3000} rows={4} placeholder="Explique o apoio de que precisa." />
      </label>
      <label>
        Localização
        <input name="location" required minLength={2} maxLength={150} defaultValue={city} placeholder="Cidade ou bairro" />
      </label>
      <label>
        Data pretendida (opcional)
        <input name="preferredStartDate" type="date" />
      </label>
      {message && <p className="professional-form-success" role="status">{message}</p>}
      {error && <p className="professional-form-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "A enviar..." : "Enviar pedido"}
      </button>
    </form>
  );
}
