"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const audiences = [
  ["ALL", "Todos os utilizadores ativos"],
  ["CANDIDATES", "Profissionais"],
  ["CLIENTS", "Clientes"],
  ["RECRUITERS", "Recrutadores"],
  ["ADMINS", "Administradores"],
  ["SPECIFIC_USERS", "Utilizadores selecionados"],
] as const;

export default function AnnouncementForm({
  users,
}: {
  users: Array<{ id: string; name: string; email: string; role: string }>;
}) {
  const router = useRouter();
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLocaleLowerCase("pt-PT");
    return users.filter((user) =>
      (!userRole || user.role === userRole) &&
      (!query || `${user.name} ${user.email}`.toLocaleLowerCase("pt-PT").includes(query)),
    );
  }, [userRole, userSearch, users]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const formElement = event.currentTarget;
    try {
      const form = new FormData(formElement);
      const data = Object.fromEntries(form.entries());
      delete data.userIds;
      const response = await fetch("/api/admin/notificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userIds: Array.from(selectedUserIds) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível publicar o aviso.");
      formElement.reset();
      setUserSearch("");
      setUserRole("");
      setSelectedUserIds(new Set());
      setSuccess(`Aviso enviado a ${result.recipientCount} utilizadores.`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ocorreu um erro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="professional-form-card admin-job-form" onSubmit={submit}>
      <h2>Novo aviso</h2>
      <label>Título<input name="title" required minLength={3} maxLength={150} /></label>
      <label>Mensagem<textarea name="content" required minLength={5} maxLength={3000} rows={4} /></label>
      <label>Destinatários<select name="audience" required defaultValue="ALL">{audiences.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <fieldset className="admin-recipient-picker">
        <legend>Destinatários específicos (máximo 500)</legend>
        <label className="admin-picker-filter">
          Pesquisar utilizador
          <input
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Nome ou e-mail"
            aria-label="Pesquisar destinatário por nome ou e-mail"
          />
        </label>
        <label className="admin-picker-filter">
          Filtrar por perfil
          <select value={userRole} onChange={(event) => setUserRole(event.target.value)}>
            <option value="">Todos os perfis</option>
            <option value="CANDIDATE">Profissionais</option>
            <option value="CLIENT">Clientes</option>
          </select>
        </label>
        <p className="admin-picker-count" aria-live="polite">
          {selectedUserIds.size} selecionados · {filteredUsers.length} de {users.length} utilizadores visíveis
        </p>
        {filteredUsers.length === 0 ? <p role="status">Não foram encontrados utilizadores com esses filtros.</p> :
          filteredUsers.map((user) => (
            <label key={user.id}>
              <input
                type="checkbox"
                name="userIds"
                value={user.id}
                checked={selectedUserIds.has(user.id)}
                disabled={!selectedUserIds.has(user.id) && selectedUserIds.size >= 500}
                onChange={(event) => setSelectedUserIds((current) => {
                  const next = new Set(current);
                  if (event.target.checked) next.add(user.id);
                  else next.delete(user.id);
                  return next;
                })}
              />
              {user.name} · {user.email} · {user.role === "CANDIDATE" ? "Profissional" : user.role === "CLIENT" ? "Cliente" : "Outro perfil"}
            </label>
          ))}
      </fieldset>
      {selectedUserIds.size >= 500 && <p className="admin-picker-count" role="status">Limite de 500 destinatários específicos atingido.</p>}
      <label>Texto do botão (opcional)<input name="buttonText" maxLength={50} /></label>
      <label>Ligação interna (opcional)<input name="buttonUrl" placeholder="/profissional/dashboard" maxLength={300} /></label>
      {success && <p className="professional-form-success" role="status">{success}</p>}
      {error && <p className="professional-form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={saving}>{saving ? "A publicar..." : "Publicar aviso"}</button>
    </form>
  );
}
