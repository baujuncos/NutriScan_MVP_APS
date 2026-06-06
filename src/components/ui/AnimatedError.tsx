'use client';

interface AnimatedErrorProps {
  message?: string;
  className?: string;
}

export default function AnimatedError({ message, className = '' }: AnimatedErrorProps) {
  const isVisible = Boolean(message);

  return (
    <div
      className={`grid overflow-hidden transition-all duration-300 ease-out ${isVisible ? 'grid-rows-[1fr] opacity-100 mb-0' : 'grid-rows-[0fr] opacity-0 mb-0'} ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="min-h-0 overflow-hidden">
        {message ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}