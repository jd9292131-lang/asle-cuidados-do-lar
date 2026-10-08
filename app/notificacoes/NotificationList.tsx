"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function markRead(id: string) {
    setError("");
    const response = await fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Não foi possível atualizar a notificação.");
      return;
    }
    router.refresh();
  }

  if (notifications.length === 0) {
    return <section className="professional-form-card"><h2>Sem notificações</h2><p>Os avisos da equipa ASLE aparecerão aqui.</p></section>;
  }

  return (
    <section className="admin-user-list">
      {error && <p className="professional-form-error" role="alert">{error}</p>}
      {notifications.map((notification) => (
        <article className={`notification-card ${notification.readAt ? "read" : "unread"}`} key={notification.id}>
          <div>
            <span className="card-label">{new Date(notification.createdAt).toLocaleString("pt-PT")} {notification.readAt ? "· Lida" : "· Nova"}</span>
            <h2>{notification.title}</h2>
            <p>{notification.message}</p>
          </div>
          <div className="notification-actions">
            {!notification.readAt && <button className="admin-action-button" type="button" onClick={() => void markRead(notification.id)}>Marcar como lida</button>}
            {notification.actionUrl && <a className="secondary-button" href={notification.actionUrl}>Abrir</a>}
          </div>
        </article>
      ))}
    </section>
  );
}
