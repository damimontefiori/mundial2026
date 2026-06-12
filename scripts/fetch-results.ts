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

  // Guard anti-regresión: un partido FINISHED no "se desjuega". Si la API tuvo un hipo y
  // mapeó MENOS partidos jugados que el archivo actual, no lo pisamos (evita publicar un
  // results.json vacío/incompleto que desbloquearía partidos ya jugados en el cliente).
  // Igual o más jugados sí escribe, así que las correcciones de marcador se aplican.
  if (existsSync(OUT)) {
    try {
      const prev = JSON.parse(readFileSync(OUT, 'utf8')) as OfficialResultsFile;
      const prevFinished = Object.values(prev.results ?? {}).filter(
        (r) => r.status === 'FINISHED',
      ).length;
      if (finished < prevFinished) {
        console.warn(
          `⚠ La API mapeó ${finished} jugados pero el archivo actual tiene ${prevFinished}. Se omite la escritura para no regresar.`,
        );
        return;
      }
    } catch {
      // Archivo previo ausente o ilegible: seguimos y lo (re)generamos.
    }
  }

  const file: OfficialResultsFile = {
    updatedAt: new Date().toISOString(),
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
