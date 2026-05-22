'use client';

import { getPasswordRuleStatus } from '@/lib/password';

type Props = {
  password: string;
};

function RuleItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-gray-500'}`}>
      <span aria-hidden>{ok ? '✓' : '•'}</span>
      <span>{text}</span>
    </li>
  );
}

export default function PasswordRules({ password }: Props) {
  const status = getPasswordRuleStatus(password);

  return (
    <ul className="mt-1 space-y-0.5 text-xs" aria-live="polite">
      <RuleItem ok={status.minLength} text="Al menos 8 caracteres" />
      <RuleItem ok={status.hasUppercase} text="Al menos 1 mayúscula" />
      <RuleItem ok={status.hasLowercase} text="Al menos 1 minúscula" />
      <RuleItem ok={status.hasNumber} text="Al menos 1 número" />
    </ul>
  );
}
