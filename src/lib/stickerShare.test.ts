import { describe, expect, it } from 'vitest';
import { buildMissingMessage, buildRepeatedMessage } from './stickerShare';

const URL = 'https://mundialapp.com.ar';

describe('buildRepeatedMessage', () => {
  it('lista los números LOCALES (1..20) de los equipos con repes', () => {
    // ARG3 ×2 y ARG13 ×3 → línea "ARG: 3, 13" (no los códigos crudos).
    const msg = buildRepeatedMessage({ ARG3: 2, ARG13: 3, ARG5: 1 });
    expect(msg).toContain('ARG: 3, 13');
    expect(msg).not.toContain('ARG3'); // usa el número, no el código
    expect(msg).toContain(URL);
    expect(msg).toContain('repetidas');
  });

  it('incluye secciones especiales por su código (Apertura, Coca-Cola)', () => {
    const msg = buildRepeatedMessage({ FWC1: 2, CC2: 4 });
    expect(msg).toContain('Apertura: FWC1');
    expect(msg).toContain('Coca-Cola: CC2');
  });

  it('omite secciones sin repes y avisa cuando no hay ninguna', () => {
    const msg = buildRepeatedMessage({ ARG3: 1, BRA1: 0 });
    expect(msg).not.toContain('ARG:'); // no hay líneas de sección
    expect(msg).not.toContain('Tengo estas figuritas repetidas para cambiar');
    expect(msg).toContain('Todavía no tengo figuritas repetidas');
    expect(msg).toContain(URL);
  });
});

describe('buildMissingMessage', () => {
  it('con álbum vacío lista las 20 figuritas de cada equipo', () => {
    const msg = buildMissingMessage({});
    expect(msg).toContain('ARG: 1, 2, 3');
    expect(msg).toContain(', 20'); // hasta la 20
    expect(msg).toContain('Me faltan');
    expect(msg).toContain(URL);
  });

  it('una figurita que ya tengo no aparece como faltante', () => {
    // Tengo toda Argentina (1..20) → ARG no debe figurar; falta BRA1.
    const owned: Record<string, number> = {};
    for (let n = 1; n <= 20; n++) owned[`ARG${n}`] = 1;
    const msg = buildMissingMessage(owned);
    expect(msg).not.toMatch(/🇦🇷 ARG:/);
    expect(msg).toContain('BRA: 1');
  });
});
