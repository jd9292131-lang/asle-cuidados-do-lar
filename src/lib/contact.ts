const ASLE_WHATSAPP_NUMBER = "244900000000";

export function getAsleWhatsAppUrl(message: string) {
  return `https://wa.me/${ASLE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
