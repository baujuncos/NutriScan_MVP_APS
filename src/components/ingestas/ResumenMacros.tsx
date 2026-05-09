import { Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { formatOneDecimal } from '@/lib/ingestas';

export default function ResumenMacros({
  kcal_total,
  proteinas_g,
  carbs_g,
  grasas_g,
}: {
  kcal_total: number;
  proteinas_g: number;
  carbs_g: number;
  grasas_g: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <MacroPill icon={Flame} label="Kcal" value={`${formatOneDecimal(kcal_total)} kcal`} color="bg-orange-100 text-orange-700" />
      <MacroPill icon={Beef} label="Proteínas" value={`${formatOneDecimal(proteinas_g)} g`} color="bg-rose-100 text-rose-700" />
      <MacroPill icon={Wheat} label="Carbs" value={`${formatOneDecimal(carbs_g)} g`} color="bg-yellow-100 text-yellow-700" />
      <MacroPill icon={Droplets} label="Grasas" value={`${formatOneDecimal(grasas_g)} g`} color="bg-purple-100 text-purple-700" />
    </div>
  );
}

function MacroPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl px-3 py-2 ${color}`}>
      <div className="flex items-center gap-1 text-xs font-medium">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
