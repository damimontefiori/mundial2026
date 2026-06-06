import type { Metadata } from 'next';
import { StickersView } from '@/features/stickers/StickersView';

export const metadata: Metadata = { title: 'Figuritas' };

export default function Page() {
  return <StickersView />;
}
