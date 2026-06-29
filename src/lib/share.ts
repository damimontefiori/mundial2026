/**
 * Comparte texto por WhatsApp. En móvil abre la app de WhatsApp; en desktop,
 * WhatsApp Web. El usuario elige el contacto/grupo destino.
 */
export function shareViaWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function shareApp(): Promise<'shared' | 'copied'> {
  const url = window.location.origin;
  const data = {
    title: 'Mundial 2026',
    text: 'Seguí el Mundial 2026 con fixture, llave, premios y figuritas.',
    url,
  };

  if (navigator.share) {
    await navigator.share(data);
    return 'shared';
  }

  await navigator.clipboard.writeText(url);
  return 'copied';
}
