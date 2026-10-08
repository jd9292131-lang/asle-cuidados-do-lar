import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getAsleWhatsAppUrl } from "@/lib/contact";

export default function RecoverPasswordPage() {
  return (
    <main className="asle-auth-page">
      <section className="asle-recovery-panel">
        <span className="asle-auth-label">RECUPERAR ACESSO</span>
        <h1>Precisa de ajuda para entrar?</h1>
        <p>
          Contacte a equipa ASLE pelo WhatsApp. Para proteger a sua conta,
          não envie a sua palavra-passe; a equipa orientará a recuperação do acesso.
        </p>
        <a
          className="asle-btn asle-btn-primary"
          href={getAsleWhatsAppUrl("Olá, preciso de ajuda para recuperar o acesso à minha conta ASLE.")}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} />
          Pedir ajuda pelo WhatsApp
        </a>
        <Link href="/entrar">Voltar ao início de sessão</Link>
      </section>
    </main>
  );
}
