/**
 * Trae los resultados reales del Mundial desde football-data.org y los escribe en
 * `public/results.json` (indexados por nuestro id de partido). Lo corre un job
 * programado (ver `.github/workflows/update-results.yml`); también se puede correr
 * a mano con `npm run update:results` (necesita FOOTBALL_DATA_TOKEN).
 *
 * El token NUNCA llega al cliente: el fetch ocurre acá (CI), no en el navegador.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
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
