/**
 * Arqueros titulares confirmados del Mundial 2026 (al 22/06/2026), por id de equipo.
 * Fuente: docs/arqueros_titulares_mundial_2026_confirmados.md. Se muestra junto al
 * Guante de Oro: la fuente de datos gratuita (football-data.org) no informa el arquero,
 * así que este dato es estático (se actualiza a mano si cambia un titular).
 */
export const goalkeepersByTeamId: Record<string, string> = {
  // Grupo A
  MEX: 'Raúl Rangel',
  RSA: 'Ronwen Williams',
  KOR: 'Kim Seung-gyu',
  CZE: 'Matěj Kovář',
  // Grupo B
  CAN: 'Maxime Crépeau',
  BIH: 'Nikola Vasilj',
  QAT: 'Mahmoud Abunada',
  SUI: 'Gregor Kobel',
  // Grupo C
  BRA: 'Alisson Becker',
  MAR: 'Yassine Bounou',
  HAI: 'Johny Placide',
  SCO: 'Angus Gunn',
  // Grupo D
  USA: 'Matt Freese',
  PAR: 'Orlando Gill',
  AUS: 'Patrick Beach',
  TUR: 'Uğurcan Çakır',
  // Grupo E
  GER: 'Manuel Neuer',
  CUW: 'Eloy Room',
  CIV: 'Yahia Fofana',
  ECU: 'Hernán Galíndez',
  // Grupo F
  NED: 'Bart Verbruggen',
  JPN: 'Zion Suzuki',
  SWE: 'Kristoffer Nordfeldt',
  TUN: 'Aymen Dahmen',
  // Grupo G
  BEL: 'Thibaut Courtois',
  EGY: 'Mostafa Shobeir',
  IRN: 'Alireza Beiranvand',
  NZL: 'Max Crocombe',
  // Grupo H
  ESP: 'Unai Simón',
  CPV: 'Vozinha',
  KSA: 'Mohammed Al-Owais',
  URU: 'Fernando Muslera',
  // Grupo I
  FRA: 'Mike Maignan',
  SEN: 'Édouard Mendy',
  IRQ: 'Jalal Hassan',
  NOR: 'Ørjan Nyland',
  // Grupo J
  ARG: 'Emiliano Martínez',
  ALG: 'Luca Zidane',
  AUT: 'Alexander Schlager',
  JOR: 'Yazeed Abu Laila',
  // Grupo K
  POR: 'Diogo Costa',
  COD: 'Lionel Mpasi',
  UZB: 'Utkir Yusupov',
  COL: 'Camilo Vargas',
  // Grupo L
  ENG: 'Jordan Pickford',
  CRO: 'Dominik Livaković',
  GHA: 'Lawrence Ati-Zigi',
  PAN: 'Orlando Mosquera',
};

export function goalkeeperOf(teamId: string): string | undefined {
  return goalkeepersByTeamId[teamId];
}
