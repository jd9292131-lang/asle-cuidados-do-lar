import {
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { getAsleWhatsAppUrl } from "@/lib/contact";

export default function CTA() {
  return (
    <section id="contacto" className="asle-cta">
      <div className="asle-container asle-cta-inner">
        <div>
          <h2>Vamos encontrar a solução certa para si.</h2>

          <p>
            Seja para contratar ou para encontrar uma oportunidade, a ASLE
            está pronta para ajudar.
          </p>
        </div>

        <a
          href={getAsleWhatsAppUrl("Olá, gostaria de falar com a ASLE sobre os serviços para o lar.")}
          className="asle-btn asle-btn-gold asle-btn-large"
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} />
          Contactar pelo WhatsApp
          <ArrowRight size={18} />
        </a>
        <Link href="/registar" className="asle-cta-secondary">
          Quero trabalhar com a ASLE
        </Link>
      </div>
    </section>
  );
}