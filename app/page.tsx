import Link from "next/link";
import Hero from "../components/home/Hero";
import Services from "../components/home/Services";
import HowItWorks from "../components/home/HowItWorks";
import ForFamilies from "../components/home/ForFamilies";
import CTA from "../components/home/CTA";

import { ArrowRight } from "lucide-react";
import { getAsleWhatsAppUrl } from "@/lib/contact";

function AsleWordmark() {
  return (
    <>
      <span className="asle-brand-monogram" aria-hidden="true">A</span>
      <span className="asle-brand-copy">
        <strong>ASLE</strong>
        <small>Cuidados do Lar</small>
      </span>
    </>
  );
}

export default function HomePage() {
  return (
    <>
      {/* HEADER */}
      <header className="asle-header">
        <div className="asle-container asle-header-inner">
          <Link href="/" className="asle-logo" aria-label="ASLE — Cuidados do Lar">
            <AsleWordmark />
          </Link>

          <nav className="asle-nav" aria-label="Navegação principal">
            <a href="#servicos">Serviços</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#profissionais">Profissionais</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className="asle-header-actions">
            <a href="/entrar" className="asle-header-login">
              Entrar
            </a>

            <a
              href="/registar"
              className="asle-btn asle-btn-primary"
            >
              Começar agora
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <Hero />

      {/* SERVIÇOS */}
      <Services />

      {/* COMO FUNCIONA */}
      <section id="como-funciona">
        <HowItWorks />
      </section>

      {/* FAMÍLIAS E PROFISSIONAIS */}
      <ForFamilies />

      {/* CTA */}
      <CTA />

      {/* FOOTER */}
      <footer className="asle-footer">
        <div className="asle-container">
          <div className="asle-footer-grid">
            <div className="asle-footer-brand">
              <Link href="/" className="asle-logo" aria-label="ASLE — Cuidados do Lar">
                <AsleWordmark />
              </Link>

              <p>
                Recrutamento, seleção e intermediação de
                profissionais para cuidados do lar.
              </p>
            </div>

            <div className="asle-footer-column">
              <h4>ASLE</h4>

              <a href="#servicos">Serviços</a>
              <a href="#como-funciona">Como funciona</a>
              <a
                href={getAsleWhatsAppUrl("Olá, gostaria de falar com a ASLE.")}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>

            <div className="asle-footer-column">
              <h4>Profissionais</h4>

              <a href="/registar">Criar perfil</a>
              <a href="/entrar">Área profissional</a>
            </div>

            <div className="asle-footer-column">
              <h4>Clientes</h4>

              <a href="/registar">Solicitar profissional</a>
              <a href="/entrar">Área do cliente</a>
            </div>
          </div>

          <div className="asle-footer-bottom">
            <p>
              © {new Date().getFullYear()} ASLE - Cuidados do Lar.
              Todos os direitos reservados.
            </p>

          </div>
        </div>
      </footer>
    </>
  );
}
