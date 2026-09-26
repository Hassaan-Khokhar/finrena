import { ArenaShell } from '../../../components/arena/arena-shell';

export default async function ArenaTickerPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const resolvedParams = await params;
  const tickerId = resolvedParams.ticker ? resolvedParams.ticker.toUpperCase() : 'NVDA';

  return <ArenaShell initialTicker={tickerId} />;
}
