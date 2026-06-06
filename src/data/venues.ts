import type { Venue } from '@/types';

/**
 * Las 16 sedes del Mundial 2026 (USA, Canadá y México).
 * Estos datos son oficiales y estables. La zona horaria IANA se usa solo
 * como referencia; la app muestra todo en horario de Argentina (UTC−3).
 */
export const venues: Venue[] = [
  {
    id: 'nyc',
    city: 'Nueva York / Nueva Jersey',
    country: 'USA',
    stadium: 'MetLife Stadium',
    timezone: 'America/New_York',
  },
  {
    id: 'dallas',
    city: 'Dallas',
    country: 'USA',
    stadium: 'AT&T Stadium',
    timezone: 'America/Chicago',
  },
  {
    id: 'la',
    city: 'Los Ángeles',
    country: 'USA',
    stadium: 'SoFi Stadium',
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'sfbay',
    city: 'San Francisco Bay Area',
    country: 'USA',
    stadium: "Levi's Stadium",
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'seattle',
    city: 'Seattle',
    country: 'USA',
    stadium: 'Lumen Field',
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'kansas',
    city: 'Kansas City',
    country: 'USA',
    stadium: 'Arrowhead Stadium',
    timezone: 'America/Chicago',
  },
  {
    id: 'houston',
    city: 'Houston',
    country: 'USA',
    stadium: 'NRG Stadium',
    timezone: 'America/Chicago',
  },
  {
    id: 'atlanta',
    city: 'Atlanta',
    country: 'USA',
    stadium: 'Mercedes-Benz Stadium',
    timezone: 'America/New_York',
  },
  {
    id: 'miami',
    city: 'Miami',
    country: 'USA',
    stadium: 'Hard Rock Stadium',
    timezone: 'America/New_York',
  },
  {
    id: 'boston',
    city: 'Boston',
    country: 'USA',
    stadium: 'Gillette Stadium',
    timezone: 'America/New_York',
  },
  {
    id: 'philadelphia',
    city: 'Filadelfia',
    country: 'USA',
    stadium: 'Lincoln Financial Field',
    timezone: 'America/New_York',
  },
  {
    id: 'toronto',
    city: 'Toronto',
    country: 'CAN',
    stadium: 'BMO Field',
    timezone: 'America/Toronto',
  },
  {
    id: 'vancouver',
    city: 'Vancouver',
    country: 'CAN',
    stadium: 'BC Place',
    timezone: 'America/Vancouver',
  },
  {
    id: 'mexico',
    city: 'Ciudad de México',
    country: 'MEX',
    stadium: 'Estadio Azteca',
    timezone: 'America/Mexico_City',
  },
  {
    id: 'guadalajara',
    city: 'Guadalajara',
    country: 'MEX',
    stadium: 'Estadio Akron',
    timezone: 'America/Mexico_City',
  },
  {
    id: 'monterrey',
    city: 'Monterrey',
    country: 'MEX',
    stadium: 'Estadio BBVA',
    timezone: 'America/Monterrey',
  },
];

export const venuesById: Record<string, Venue> = Object.fromEntries(venues.map((v) => [v.id, v]));

export function getVenue(id: string): Venue | undefined {
  return venuesById[id];
}
