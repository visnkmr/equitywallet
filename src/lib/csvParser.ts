import fs from 'fs';
import path from 'path';
import { Holding } from '@/types/holding';

interface ApiHolding {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  isin: string;
  product: string;
  price: number;
  quantity: number;
  t1_quantity: number;
  realised_quantity: number;
  authorised_quantity: number;
  authorised_date: string;
  opening_quantity: number;
  collateral_quantity: number;
  collateral_type: string;
  discrepancy: boolean;
  short_quantity: number;
  used_quantity: number;
  authorisation: Record<string, unknown>;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
  mtf: {
    quantity: number;
    used_quantity: number;
    average_price: number;
    value: number;
    initial_margin: number;
  };
}

interface ApiResponse {
  status: string;
  data: ApiHolding[];
}

export function parseHoldingsCSV(): Holding[] {
  const csvPath = path.join(process.cwd(), 'holdings.csv');
  let csvContent: string;

  try {
    csvContent = fs.readFileSync(csvPath, 'utf-8');
  } catch {
    // If CSV file doesn't exist, try to read from holdings.json
    const jsonPath = path.join(process.cwd(), 'holdings.json');
    try {
      csvContent = fs.readFileSync(jsonPath, 'utf-8');
      return parseApiResponse(csvContent);
    } catch {
      throw new Error('Neither holdings.csv nor holdings.json found');
    }
  }

  // Try to parse as JSON first (API response format)
  try {
    return parseApiResponse(csvContent);
  } catch {
    // Fall back to CSV parsing
    return parseCSV(csvContent);
  }
}

function parseApiResponse(content: string): Holding[] {
  const response: ApiResponse = JSON.parse(content);

  if (response.status !== 'success' || !Array.isArray(response.data)) {
    throw new Error('Invalid API response format');
  }

  return response.data.map(apiHolding => {
    const quantity = apiHolding.quantity;
    const avgCost = apiHolding.average_price;
    const ltp = apiHolding.last_price;
    const invested = quantity * avgCost;
    const curVal = quantity * ltp;
    const pl = apiHolding.pnl;
    const netChg = invested > 0 ? (pl / invested) * 100 : 0;
    const dayChg = apiHolding.day_change_percentage;

    return {
      instrument: apiHolding.tradingsymbol,
      quantity,
      avgCost,
      ltp,
      invested,
      curVal,
      pl,
      netChg,
      dayChg,
      tags: [],
      hidden: false,
      customValue: ltp,
      targetAvgCost: avgCost
    };
  });
}

function parseCSV(content: string): Holding[] {
  const lines = content.split('\n').filter(line => line.trim());
  const holdings: Holding[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line handling quoted fields
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    if (fields.length >= 9) {
      const avgCost = parseFloat(fields[2]) || 0;
      const ltp = parseFloat(fields[3]) || 0;
      holdings.push({
        instrument: fields[0].replace(/"/g, ''),
        quantity: parseFloat(fields[1]) || 0,
        avgCost,
        ltp,
        invested: parseFloat(fields[4]) || 0,
        curVal: parseFloat(fields[5]) || 0,
        pl: parseFloat(fields[6]) || 0,
        netChg: parseFloat(fields[7]) || 0,
        dayChg: parseFloat(fields[8]) || 0,
        tags: [],
        hidden: false,
        customValue: ltp,
        targetAvgCost: avgCost
      });
    }
  }

  return holdings;
}