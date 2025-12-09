import { Holding, Totals } from '@/types/holding';
import HoldingsTable from '@/components/HoldingsTable';

function calculateTotals(holdings: Holding[]): Totals {
  const visibleHoldings = holdings.filter(h => !h.hidden);
  
  return visibleHoldings.reduce(
    (acc, h) => ({
      invested: acc.invested + h.invested,
      curVal: acc.curVal + h.curVal,
      pl: acc.pl + h.pl,
      plPercent: 0
    }),
    { invested: 0, curVal: 0, pl: 0, plPercent: 0 }
  );
}

export default function HomePage() {
  // Start with empty holdings - user must upload a file
  const holdings: Holding[] = [];
  const totals = calculateTotals(holdings);
  
  return (
    <HoldingsTable holdings={holdings} totals={totals} />
  );
}
