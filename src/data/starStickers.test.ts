import { describe, expect, it } from 'vitest';
import { STAR_STICKERS } from './starStickers';
import { stickerAlbum } from './stickers';

const albumCodes = new Set(stickerAlbum.sections.flatMap((s) => s.codes));

describe('STAR_STICKERS', () => {
  it('todas las estrellas son códigos reales del álbum', () => {
    for (const code of Object.keys(STAR_STICKERS)) {
      expect(albumCodes.has(code), `${code} no existe en el álbum`).toBe(true);
    }
  });

  it('cada estrella tiene jugador, imagen WebP y equipo válido', () => {
    for (const s of Object.values(STAR_STICKERS)) {
      expect(s.player.length).toBeGreaterThan(0);
      expect(s.role.length).toBeGreaterThan(0);
      expect(s.image).toMatch(/^\/stars\/.+\.webp$/);
      expect(s.teamId).toMatch(/^[A-Z]{3}$/);
    }
  });

  it('la clave del mapa coincide con el campo code', () => {
    for (const [key, s] of Object.entries(STAR_STICKERS)) {
      expect(s.code).toBe(key);
    }
  });
});
