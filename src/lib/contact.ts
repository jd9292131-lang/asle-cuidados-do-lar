const ASLE_WHATSAPP_NUMBER = "244955792099";

export function getAsleWhatsAppUrl(message: string) {
  return `https://wa.me/${ASLE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
