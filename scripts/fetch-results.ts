/**
 * Trae los resultados reales del Mundial desde football-data.org y los escribe en
 * `public/results.json` (indexados por nuestro id de partido). Lo corre un job
 * programado (ver `.github/workflows/update-results.yml`); también se puede correr
 * a mano con `npm run update:results` (necesita FOOTBALL_DATA_TOKEN).
 *
 * El token NUNCA llega al cliente: el fetch ocurre acá (CI), no en el navegador.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiToOfficial, type ApiMatchLite } from '../src/lib/ingestApiResults';
import type { OfficialResultsFile } from '../src/types';

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const COMPETITION = process.env.WC_COMPETITION ?? 'WC';
const API = `https://api.football-data.org/v4/competitions/${COMPETITION}/matches`;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/results.json');

async function main(): Promise<void> {
  if (!TOKEN) {
    console.error('✖ Falta FOOTBALL_DATA_TOKEN (token gratis en football-data.org/client/register).');
    process.exit(1);
  }

  const res = await fetch(API, { headers: { 'X-Auth-Token': TOKEN } });
  if (!res.ok) {
    console.error(`✖ API ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = (await res.json()) as { matches?: ApiMatchLite[] };
  const matches = data.matches ?? [];
  const results = apiToOfficial(matches);
  const finished = Object.values(results).filter((r) => r.status === 'FINISHED').length;

  // Archivo previo: lo usamos para el guard anti-regresión y para arrastrar las anclas
  // del reloj en vivo.
  let prev: OfficialResultsFile | null = null;
  if (existsSync(OUT)) {
    try {
      prev = JSON.parse(readFileSync(OUT, 'utf8')) as OfficialResultsFile;
    } catch {
      prev = null; // archivo ausente o ilegible: se regenera.
    }
  }

  // Guard anti-regresión: un partido FINISHED no "se desjuega". Si la API tuvo un hipo y
  // mapeó MENOS partidos jugados que el archivo actual, no lo pisamos (evita publicar un
  // results.json vacío/incompleto que desbloquearía partidos ya jugados en el cliente).
  if (prev) {
    const prevFinished = Object.values(prev.results ?? {}).filter(
      (r) => r.status === 'FINISHED',
    ).length;
    if (finished < prevFinished) {
      console.warn(
        `⚠ La API mapeó ${finished} jugados pero el archivo actual tiene ${prevFinished}. Se omite la escritura para no regresar.`,
      );
      return;
    }
  }

  // Anclas del reloj en vivo: timestamps que se setean UNA sola vez (no cambian cada
  // minuto), derivados de las transiciones de estado. El cliente estima el minuto a partir
  // de ellas, sin que el minuto se persista (no habría un commit/deploy por minuto).
  const now = new Date().toISOString();
  for (const [id, r] of Object.entries(results)) {
    const p = prev?.results?.[id];
    if (p?.liveStartedAt) r.liveStartedAt = p.liveStartedAt;
    else if (r.status === 'IN_PLAY') r.liveStartedAt = now; // arrancó el partido
    if (p?.secondHalfStartedAt) r.secondHalfStartedAt = p.secondHalfStartedAt;
    else if (r.status === 'IN_PLAY' && p?.status === 'PAUSED') r.secondHalfStartedAt = now; // 2do tiempo
  }

  // Solo reescribir si los RESULTADOS cambiaron (ignorando el timestamp): el pinger de
  // 1 min no debe generar un commit/deploy por corrida cuando no pasó nada en la cancha.
  // El minuto en vivo no se persiste (lo estima el cliente), así que un partido en juego
  // sin novedades no produce cambios acá.
  if (prev && JSON.stringify(prev.results ?? {}) === JSON.stringify(results)) {
    console.log('✔ Sin cambios en los resultados; no se reescribe.');
    return;
  }

  const file: OfficialResultsFile = {
    updatedAt: now,
    source: 'football-data.org',
    results,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  console.log(
    `✔ results.json: ${Object.keys(results).length} partidos mapeados (${finished} jugados) de ${matches.length} de la API.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
