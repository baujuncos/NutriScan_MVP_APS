'use client';

import { checkPassword } from '@/lib/password';

interface PasswordRulesProps {
  value: string;
  className?: string;
}

const RULES: { key: keyof ReturnType<typeof checkPassword>; label: string }[] = [
  { key: 'length', label: 'Al menos 8 caracteres' },
  { key: 'upper', label: 'Una letra mayúscula' },
  { key: 'lower', label: 'Una letra minúscula' },
  { key: 'digit', label: 'Un número' },
];

export default function PasswordRules({ value, className = '' }: PasswordRulesProps) {
  const c = checkPassword(value ?? '');
  return (
    <ul
      role="status"
      aria-live="polite"
      className={`flex flex-col gap-1 text-xs ${className}`}
    >
      {RULES.map((r) => {
        const ok = c[r.key];
        return (
          <li
            key={r.key}
            className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-gray-500'}`}
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                ok ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-transparent'
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="sr-only">{ok ? 'Cumple: ' : 'Pendiente: '}</span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
