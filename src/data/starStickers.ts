/**
 * Figuritas "estrella": al conseguirlas (marcarlas como tenidas) se dispara un festejo
 * con confeti y la imagen del jugador. Las imágenes viven en `public/stars/` (WebP
 * optimizadas) y se precargan al abrir el tab Figus.
 */
export interface StarSticker {
  code: string;
  player: string;
  /** Frase que sigue a "Conseguiste a {player}". Ej: "el capitán de Argentina". */
  role: string;
  /** Ruta pública de la imagen (WebP con transparencia). */
  image: string;
  teamId: string;
}

export const STAR_STICKERS: Record<string, StarSticker> = {
  ARG2: {
    code: 'ARG2',
    player: 'Dibu Martínez',
    role: 'el arquero campeón de Argentina',
    image: '/stars/Dibu_Martinez.webp',
    teamId: 'ARG',
  },
  ARG17: {
    code: 'ARG17',
    player: 'Lionel Messi',
    role: 'el capitán de Argentina',
    image: '/stars/Messi.webp',
    teamId: 'ARG',
  },
  ESP15: {
    code: 'ESP15',
    player: 'Lamine Yamal',
    role: 'la joya de España',
    image: '/stars/Lamine_Yamal.webp',
    teamId: 'ESP',
  },
  CPV2: {
    code: 'CPV2',
    player: 'Vozinha',
    role: 'el arquero de Cabo Verde',
    image: '/stars/Vozinha.webp',
    teamId: 'CPV',
  },
  FRA20: {
    code: 'FRA20',
    player: 'Kylian Mbappé',
    role: 'la estrella de Francia',
    image: '/stars/Mbappe.webp',
    teamId: 'FRA',
  },
  POR15: {
    code: 'POR15',
    player: 'Cristiano Ronaldo',
    role: 'el capitán de Portugal',
    image: '/stars/Cristiano.webp',
    teamId: 'POR',
  },
};

/** Rutas de las imágenes estrella (para precargar). */
export const STAR_IMAGES = Object.values(STAR_STICKERS).map((s) => s.image);
