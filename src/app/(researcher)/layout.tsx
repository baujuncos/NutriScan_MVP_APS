import { getAuthenticatedResearcher } from '@/lib/researcher/athletes';
import ResearcherShell from '@/components/researcher/ResearcherShell';

export const dynamic = 'force-dynamic';

/**
 * Shared chrome for the researcher panel. The auth + role guard lives here
 * once, so every child page can assume an authorized researcher.
 */
export default async function ResearcherLayout({ children }: { children: React.ReactNode }) {
  const researcher = await getAuthenticatedResearcher();

  return (
    <ResearcherShell nombre={researcher.nombre} apellido={researcher.apellido}>
      {children}
    </ResearcherShell>
  );
}
