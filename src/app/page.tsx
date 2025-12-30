import { Holding, Totals } from '@/types/holding';
import HoldingsTable from '@/components/HoldingsTable';
import { calculateVisibleTotals } from '@/lib/calculations';

export default function HomePage() {
  // Start with empty holdings - user must upload a file
  const holdings: Holding[] = [];
  const totals = calculateVisibleTotals(holdings);
  
  return (
    <HoldingsTable holdings={holdings} totals={totals} />
  );
}
