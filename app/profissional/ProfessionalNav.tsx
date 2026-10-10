"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  House,
  MessageSquare,
  UserRound,
  UserRoundCheck,
} from "lucide-react";

type ProfessionalNavProps = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

const navigation = [
  {
    href: "/profissional/dashboard",
    label: "Dashboard",
    icon: House,
  },
  {
    href: "/profissional/perfil",
    label: "Meu perfil",
    icon: UserRound,
  },
  {
    href: "/profissional/documentos",
    label: "Documentos",
    icon: FileText,
  },
  {
    href: "/profissional/oportunidades",
    label: "Oportunidades",
    icon: BriefcaseBusiness,
  },
  {
    href: "/profissional/candidaturas",
    label: "Candidaturas",
    icon: UserRoundCheck,
  },
  {
    href: "/profissional/entrevistas",
    label: "Entrevistas",
    icon: CalendarDays,
  },
  {
    href: "/profissional/mensagens",
    label: "Mensagens",
    icon: MessageSquare,
  },
  {
    href: "/profissional/notificacoes",
    label: "Notificações",
    icon: Bell,
  },
];

export default function ProfessionalNav({
  user,
}: ProfessionalNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/entrar");
    router.refresh();
  }

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <aside className="professional-sidebar">
      <div className="professional-brand">
        <div className="professional-brand-mark">
          A
        </div>

        <div>
          <strong>ASLE</strong>
          <span>Cuidados do Lar</span>
        </div>
      </div>

      <div className="professional-user">
        <div className="professional-avatar">
          {initials}
        </div>

        <div className="professional-user-info">
          <strong>
            {user.firstName} {user.lastName}
          </strong>

          <span>Profissional</span>
        </div>
      </div>

      <nav className="professional-navigation">
        <span className="professional-navigation-title">
          ÁREA PROFISSIONAL
        </span>

        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/profissional/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`professional-nav-link ${
                active ? "active" : ""
              }`}
            >
              <span className="professional-nav-icon">
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="professional-sidebar-bottom">
        <div className="professional-account">
          <span className="professional-account-label">
            CONTA
          </span>

          <span className="professional-account-email">
            {user.email}
          </span>
        </div>

        <button
          type="button"
          className="professional-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          Terminar sessão
        </button>
      </div>
    </aside>
  );
}