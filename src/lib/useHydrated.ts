'use client';

import { useEffect, useState } from 'react';

/**
 * Devuelve `true` recién después del montaje en el cliente.
 * Sirve para evitar desajustes de hidratación al leer estado persistido
 * (localStorage) que no existe durante el render del servidor.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
