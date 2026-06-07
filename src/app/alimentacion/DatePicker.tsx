'use client';

import { useRouter } from 'next/navigation';

export default function DatePicker({ fecha, tipo }: { fecha: string; tipo: string }) {
  const router = useRouter();
  return (
    <input
      key={fecha}
      type="date"
      defaultValue={fecha}
      className="w-full box-border rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      onChange={(e) => {
        const value = e.target.value;
        if (!value) return;
        router.push(`/alimentacion?fecha=${value}&tipo=${tipo}`);
      }}
    />
  );
}
