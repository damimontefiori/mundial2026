import type { Metadata } from 'next';
import { BracketView } from '@/features/bracket/BracketView';

export const metadata: Metadata = { title: 'Llave' };

export default function Page() {
  return <BracketView />;
}
