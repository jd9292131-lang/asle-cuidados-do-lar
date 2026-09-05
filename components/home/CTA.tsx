import {
  ArrowRight,
  MessageCircle,
} from "lucide-react";

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

        <a href="/registar" className="asle-btn asle-btn-gold asle-btn-large">
          <MessageCircle size={18} />
          Começar agora
          <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}