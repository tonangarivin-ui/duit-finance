'use client';

import { useRouter } from 'next/navigation';
import QuickAdd, { type EditedTx } from './QuickAdd';

export default function EditSheet({
  initial,
  accounts,
  categories,
}: {
  initial: EditedTx;
  accounts: { id: number; name: string; balance: number }[];
  categories: { id: number; name: string; kind: string; color: string | null; icon: string | null }[];
}) {
  const router = useRouter();
  return (
    <QuickAdd
      open
      initial={initial}
      accounts={accounts}
      categories={categories}
      onClose={() => router.push('/history')}
    />
  );
}
