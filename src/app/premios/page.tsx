import type { Metadata } from 'next';
import { AwardsView } from '@/features/awards/AwardsView';

export const metadata: Metadata = { title: 'Premios' };

export default function Page() {
  return <AwardsView />;
}
