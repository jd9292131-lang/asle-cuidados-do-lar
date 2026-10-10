"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  House,
  MessageSquare,
  ScrollText,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

const navigation = [
  { href: "/admin/dashboard", label: "Visão geral", icon: House },
  { href: "/admin/utilizadores", label: "Utilizadores", icon: UsersRound },
  { href: "/admin/documentos", label: "Documentos", icon: FileText },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/vagas", label: "Vagas e candidaturas", icon: BriefcaseBusiness },
  { href: "/admin/candidaturas", label: "Candidaturas", icon: UserRoundCheck },
  { href: "/admin/entrevistas", label: "Entrevistas", icon: CalendarDays },
  { href: "/admin/mensagens", label: "Mensagens", icon: MessageSquare },
  { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { href: "/admin/equipa", label: "Equipa administrativa", icon: UsersRound, adminOnly: true },
  { href: "/admin/auditoria", label: "Auditoria", icon: ScrollText, adminOnly: true },
];

export default function AdminNav({
  user,
}: {
  user: { firstName: string; lastName: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      window.alert("Não foi possível terminar a sessão. Tente novamente.");
      return;
    }
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <Link href="/admin/dashboard" className="admin-brand">
        <span className="admin-brand-mark">A</span>
        <span><strong>ASLE</strong><small>Administração</small></span>
      </Link>

      <div className="admin-user-chip">
        <span className="admin-user-avatar">
          {`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}
        </span>
        <span><strong>{user.firstName} {user.lastName}</strong><small>{user.role === "ADMIN" ? "Administrador" : "Recrutador"}</small></span>
      </div>

      <nav className="admin-navigation" aria-label="Navegação administrativa">
        <span className="admin-navigation-label">GESTÃO</span>
        {navigation
          .filter((item) => !item.adminOnly || user.role === "ADMIN")
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.href}
                className={`admin-nav-link ${pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}/`)) ? "active" : ""}`}
              >
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="admin-sidebar-footer">
        <span>{user.email}</span>
        <button type="button" onClick={logout}>Terminar sessão</button>
      </div>
    </aside>
  );
}
