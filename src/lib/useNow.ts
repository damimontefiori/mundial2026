'use client';

import { useEffect, useState } from 'react';

/**
 * Devuelve `new Date()` y, mientras `active` sea true, lo refresca cada `intervalMs`
 * (default 1 s). Sirve para relojes en vivo: solo tickea cuando hace falta.
 */
export function useNow(active: boolean, intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
