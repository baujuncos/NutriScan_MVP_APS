import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import { createClient } from '@/lib/supabase/server';
import { addItemAction, deleteItemAction } from './actions';
import { formatIngestaLabel, INGESTA_TIPOS, ITEM_TIPOS, type IngestaTipo, isValidDateInput } from '@/lib/nutrition';

type AlimentoOption = {
  id_alimento: number;
  nombre: string;
  categoria: string | null;
};

type ItemRow = {
  id_item: number;
  id_alimento: number;
  tipo_item: string;
  cantidad: number | string;
  kcal: number | string;
  proteinas_g: number | string;
  grasas_g: number | string;
  carbs_g: number | string;
  alimentos: { nombre: string; categoria: string | null } | Array<{ nombre: string; categoria: string | null }> | null;
};

type IngestaRow = {
  id_ingesta: number;
  tipo: IngestaTipo;
  fecha: string;
  kcal_total: number | string;
  proteinas_total_g: number | string;
  grasas_total_g: number | string;
  carbs_total_g: number | string;
  items: ItemRow[] | null;
};

type PhysicalDataRow = {
  get_kcal: number | null;
  proteinas_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatMetric(value: number): string {
  return value.toFixed(2);
}

function getAlimentoNombre(item: ItemRow): string {
  if (Array.isArray(item.alimentos)) {
    return item.alimentos[0]?.nombre ?? `Alimento #${item.id_alimento}`;
  }
  if (item.alimentos?.nombre) return item.alimentos.nombre;
  return `Alimento #${item.id_alimento}`;
}

export default async function AlimentacionPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = params.fecha && isValidDateInput(params.fecha) ? params.fecha : today;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, apellido, role')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (profile.role === 'investigador' || profile.role === 'administrador') redirect('/dashboard');

  const { data: ingestasData } = await supabase
    .from('ingestas')
    .select(
      `
      id_ingesta,
      tipo,
      fecha,
      kcal_total,
      proteinas_total_g,
      grasas_total_g,
      carbs_total_g,
      items (
        id_item,
        id_alimento,
        tipo_item,
        cantidad,
        kcal,
        proteinas_g,
        grasas_g,
        carbs_g,
        alimentos (
          nombre,
          categoria
        )
      )
    `,
    )
    .eq('id_usuario', user.id)
    .eq('fecha', selectedDate);

  const { data: alimentosData } = await supabase
    .from('alimentos')
    .select('id_alimento, nombre, categoria')
    .order('nombre', { ascending: true })
    .limit(1000);

  const { data: physicalData } = await supabase
    .from('physical_data')
    .select('get_kcal, proteinas_g, carbohidratos_g, grasas_g')
    .eq('user_id', user.id)
    .single();

  const ingestas = (ingestasData ?? []) as IngestaRow[];
  const alimentos = (alimentosData ?? []) as AlimentoOption[];
  const physical = (physicalData ?? null) as PhysicalDataRow | null;

  const ingestaByTipo = new Map<IngestaTipo, IngestaRow>();
  ingestas.forEach((ingesta) => {
    ingestaByTipo.set(ingesta.tipo, ingesta);
  });

  const totalKcal = ingestas.reduce((acc, ingesta) => acc + toNumber(ingesta.kcal_total), 0);
  const totalProte = ingestas.reduce((acc, ingesta) => acc + toNumber(ingesta.proteinas_total_g), 0);
  const totalCarbs = ingestas.reduce((acc, ingesta) => acc + toNumber(ingesta.carbs_total_g), 0);
  const totalGrasas = ingestas.reduce((acc, ingesta) => acc + toNumber(ingesta.grasas_total_g), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
              <span className="text-lg">🍽️</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Registro Diario de Alimentación</h1>
              <p className="text-xs text-gray-500">
                {profile.nombre} {profile.apellido}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="rounded-lg border border-green-600 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              Volver a Home
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Resumen del día</h2>
              <p className="text-sm text-gray-500">Registra alimentos y el backend calcula macros por regla de tres.</p>
            </div>
            <form className="flex items-end gap-2">
              <div>
                <label htmlFor="fecha" className="text-sm font-medium text-gray-700">
                  Fecha
                </label>
                <input
                  id="fecha"
                  name="fecha"
                  type="date"
                  defaultValue={selectedDate}
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Ver
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Kcal consumidas" current={totalKcal} target={physical?.get_kcal ?? null} unit="kcal" />
            <MetricCard label="Proteínas" current={totalProte} target={physical?.proteinas_g ?? null} unit="g" />
            <MetricCard label="Carbohidratos" current={totalCarbs} target={physical?.carbohidratos_g ?? null} unit="g" />
            <MetricCard label="Grasas" current={totalGrasas} target={physical?.grasas_g ?? null} unit="g" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {INGESTA_TIPOS.map((tipo) => {
            const ingesta = ingestaByTipo.get(tipo);
            const items = ingesta?.items ?? [];

            return (
              <article key={tipo} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{formatIngestaLabel(tipo)}</h3>
                  <span className="text-xs text-gray-500">{items.length} ítems</span>
                </div>

                <form action={addItemAction} className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input type="hidden" name="fecha" value={selectedDate} />
                  <input type="hidden" name="tipo_ingesta" value={tipo} />

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-700" htmlFor={`id_alimento-${tipo}`}>
                      Alimento
                    </label>
                    <select
                      id={`id_alimento-${tipo}`}
                      name="id_alimento"
                      defaultValue=""
                      required
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    >
                      <option value="" disabled>
                        Selecciona un alimento
                      </option>
                      {alimentos.map((alimento) => (
                        <option key={alimento.id_alimento} value={alimento.id_alimento}>
                          {alimento.nombre}
                          {alimento.categoria ? ` (${alimento.categoria})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700" htmlFor={`cantidad-${tipo}`}>
                      Cantidad
                    </label>
                    <input
                      id={`cantidad-${tipo}`}
                      name="cantidad"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Ej: 120"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700" htmlFor={`tipo_item-${tipo}`}>
                      Tipo de ítem
                    </label>
                    <select
                      id={`tipo_item-${tipo}`}
                      name="tipo_item"
                      defaultValue={ITEM_TIPOS[0]}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {ITEM_TIPOS.map((tipoItem) => (
                        <option key={tipoItem} value={tipoItem}>
                          {tipoItem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Agregar ítem
                  </button>
                </form>

                {items.length > 0 ? (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id_item} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{getAlimentoNombre(item)}</p>
                            <p className="text-xs text-gray-500">
                              {toNumber(item.cantidad).toFixed(2)} · {item.tipo_item}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              {formatMetric(toNumber(item.kcal))} kcal · P {formatMetric(toNumber(item.proteinas_g))}g
                              · C {formatMetric(toNumber(item.carbs_g))}g · G {formatMetric(toNumber(item.grasas_g))}g
                            </p>
                          </div>
                          <form action={deleteItemAction}>
                            <input type="hidden" name="fecha" value={selectedDate} />
                            <input type="hidden" name="id_item" value={item.id_item} />
                            <button
                              type="submit"
                              className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin ítems cargados para este momento.</p>
                )}

                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                  <p>
                    Totales: {formatMetric(toNumber(ingesta?.kcal_total))} kcal · P{' '}
                    {formatMetric(toNumber(ingesta?.proteinas_total_g))}g · C{' '}
                    {formatMetric(toNumber(ingesta?.carbs_total_g))}g · G{' '}
                    {formatMetric(toNumber(ingesta?.grasas_total_g))}g
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current: number;
  target: number | null;
  unit: string;
}) {
  const hasTarget = target !== null && Number.isFinite(target);
  return (
    <div className="rounded-xl border border-green-100 bg-green-50 p-3">
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-xl font-bold text-green-700">{formatMetric(current)}</p>
      <p className="text-xs text-gray-500">
        {unit}
        {hasTarget ? ` / meta ${formatMetric(target)} ${unit}` : ''}
      </p>
    </div>
  );
}
