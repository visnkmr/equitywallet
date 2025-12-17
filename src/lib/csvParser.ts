import fs from 'fs';
import path from 'path';
import { Holding } from '@/types/holding';

export function parseHoldingsCSV(): Holding[] {
  const csvPath = path.join(process.cwd(), 'holdings.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const lines = csvContent.split('\n').filter(line => line.trim());
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