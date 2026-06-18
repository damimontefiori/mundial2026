/**
 * Comparte texto por WhatsApp. En móvil abre la app de WhatsApp; en desktop,
 * WhatsApp Web. El usuario elige el contacto/grupo destino.
 */
export function shareViaWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
