interface OnboardingProgressProps {
  step: 1 | 2 | 3;
  totalSteps?: number;
}

export default function OnboardingProgress({ step, totalSteps = 3 }: OnboardingProgressProps) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div
      className="flex items-center gap-2 mb-4"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-valuenow={step}
      aria-label={`Fase ${step} de ${totalSteps}`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
        {step}
      </div>
      <span className="text-sm text-gray-500">
        Fase {step} de {totalSteps}
      </span>
      <div className="flex-1 ml-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-700 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
