import { getInitials } from '@/lib/initials';

interface AvatarProps {
  nombre?: string | null;
  apellido?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

/** Circular avatar built from a person's initials over a blue→green gradient. */
export default function Avatar({ nombre, apellido, size = 'md', className = '' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 font-semibold text-white ${SIZES[size]} ${className}`}
    >
      {getInitials(nombre, apellido)}
    </span>
  );
}
