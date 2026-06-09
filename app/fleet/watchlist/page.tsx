import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import WatchlistClient from './watchlist-client';

export default async function WatchlistPage() {
  const session = await getSession();
  if (!session) redirect('/fleet/login');
  return <WatchlistClient />;
}
