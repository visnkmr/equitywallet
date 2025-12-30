import { Holding, Totals } from '@/types/holding';

export function calculateTotals(holdings: Holding[]): Totals {
  // Filter out holdings with zero current value
  const validHoldings = holdings.filter(h => h.curVal > 0);
  
  const totals = validHoldings.reduce(
    (acc, h) => ({
      invested: acc.invested + h.invested,
      curVal: acc.curVal + h.curVal,
      pl: acc.pl + h.pl,
      plPercent: 0,
      dayChg: acc.dayChg + (h.dayChg * h.invested / 100)
    }),
    { invested: 0, curVal: 0, pl: 0, plPercent: 0, dayChg: 0 }
  );
  
  // Calculate day change percentage based on total invested
  if (totals.invested > 0) {
    totals.dayChg = (totals.dayChg / totals.invested) * 100;
  }
  
  // Calculate P&L percentage based on total invested
  if (totals.invested > 0) {
    totals.plPercent = (totals.pl / totals.invested) * 100;
  }
  
  return totals;
}

export function calculateVisibleTotals(holdings: Holding[]): Totals {
  const visibleHoldings = holdings.filter(h => !h.hidden);
  return calculateTotals(visibleHoldings);
}