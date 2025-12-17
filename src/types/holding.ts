export interface Holding {
  instrument: string;
  quantity: number;
  avgCost: number;
  ltp: number;
  invested: number;
  curVal: number;
  pl: number;
  netChg: number;
  dayChg: number;
  tags: string[];
  hidden: boolean;
  customValue: number;
  targetAvgCost: number;
}

export interface Totals {
  invested: number;
  curVal: number;
  pl: number;
  plPercent: number;
}