import { calculateTotals, calculateVisibleTotals } from '../lib/calculations';
import { Holding } from '../types/holding';
import { parseHoldingsCSV } from '../lib/csvParser';

describe('Portfolio Calculations', () => {
  const mockHoldings: Holding[] = [
    {
      instrument: 'AAPL',
      quantity: 10,
      avgCost: 150,
      ltp: 160,
      invested: 1500,
      curVal: 1600,
      pl: 100,
      netChg: 6.67,
      dayChg: 2.5,
      tags: ['tech', 'growth'],
      hidden: false,
      customValue: 160,
      targetAvgCost: 155
    },
    {
      instrument: 'GOOGL',
      quantity: 5,
      avgCost: 2000,
      ltp: 2100,
      invested: 10000,
      curVal: 10500,
      pl: 500,
      netChg: 5.0,
      dayChg: -1.5,
      tags: ['tech'],
      hidden: false,
      customValue: 2100,
      targetAvgCost: 2050
    },
    {
      instrument: 'TSLA',
      quantity: 20,
      avgCost: 200,
      ltp: 180,
      invested: 4000,
      curVal: 3600,
      pl: -400,
      netChg: -10.0,
      dayChg: 3.0,
      tags: ['tech', 'volatile'],
      hidden: true, // This holding is hidden
      customValue: 180,
      targetAvgCost: 190
    },
    {
      instrument: 'DELISTED',
      quantity: 100,
      avgCost: 50,
      ltp: 0,
      invested: 5000,
      curVal: 0, // Zero current value - should be filtered out
      pl: -5000,
      netChg: -100.0,
      dayChg: 0,
      tags: [],
      hidden: false,
      customValue: 0,
      targetAvgCost: 25
    }
  ];

  describe('calculateTotals', () => {
    it('should correctly calculate total invested amount', () => {
      const result = calculateTotals(mockHoldings);
      // Excludes DELISTED (curVal: 0) = 1500 + 10000 + 4000 = 15500
      expect(result.invested).toBe(15500);
    });

    it('should correctly calculate total current value', () => {
      const result = calculateTotals(mockHoldings);
      // Excludes DELISTED (curVal: 0) = 1600 + 10500 + 3600 = 15700
      expect(result.curVal).toBe(15700);
    });

    it('should correctly calculate total P&L', () => {
      const result = calculateTotals(mockHoldings);
      // Excludes DELISTED = 100 + 500 - 400 = 200
      expect(result.pl).toBe(200);
    });

    it('should correctly calculate P&L percentage', () => {
      const result = calculateTotals(mockHoldings);
      // (200 / 15500) * 100 = 1.29%
      expect(Math.abs(result.plPercent - 1.29)).toBeLessThan(0.01);
    });

    it('should correctly calculate weighted day change', () => {
      const result = calculateTotals(mockHoldings);
      
      // Manual calculation:
      // AAPL: (2.5 * 1500 / 100) = 37.5
      // GOOGL: (-1.5 * 10000 / 100) = -150
      // TSLA: (3.0 * 4000 / 100) = 120
      // Total weighted change: 37.5 - 150 + 120 = 7.5
      // Weighted percentage: (7.5 / 15500) * 100 = 0.048%
      
      expect(Math.abs(result.dayChg - 0.05)).toBeLessThan(0.01);
    });

    it('should filter out holdings with zero current value', () => {
      const result = calculateTotals(mockHoldings);
      // DELISTED has curVal: 0, so it should be excluded
      const totalInvestedAll = mockHoldings.reduce((sum, h) => sum + h.invested, 0);
      const totalCurValAll = mockHoldings.reduce((sum, h) => sum + h.curVal, 0);
      
      expect(result.invested).toBe(totalInvestedAll - 5000); // Excludes DELISTED's 5000
      expect(result.curVal).toBe(totalCurValAll - 0); // DELISTED has curVal: 0, so it's already excluded
    });

    it('should handle empty holdings array', () => {
      const result = calculateTotals([]);
      expect(result.invested).toBe(0);
      expect(result.curVal).toBe(0);
      expect(result.pl).toBe(0);
      expect(result.plPercent).toBe(0);
      expect(result.dayChg).toBe(0);
    });

    it('should handle holdings with only zero-value items', () => {
      const zeroValueHoldings: Holding[] = [
        { ...mockHoldings[3] } // Only the delisted item
      ];
      const result = calculateTotals(zeroValueHoldings);
      expect(result.invested).toBe(0);
      expect(result.curVal).toBe(0);
      expect(result.pl).toBe(0);
      expect(result.plPercent).toBe(0);
      expect(result.dayChg).toBe(0);
    });
  });

  describe('calculateVisibleTotals', () => {
    it('should exclude hidden holdings from calculations', () => {
      const result = calculateVisibleTotals(mockHoldings);
      
      // Should exclude TSLA (hidden) and DELISTED (curVal: 0)
      // Only AAPL and GOOGL remain
      expect(result.invested).toBe(11500); // 1500 + 10000
      expect(result.curVal).toBe(12100); // 1600 + 10500
      expect(result.pl).toBe(600); // 100 + 500
      expect(Math.abs(result.plPercent - 5.22)).toBeLessThan(0.01); // (600/11500)*100
    });

    it('should return zero when all holdings are hidden', () => {
      const allHiddenHoldings = mockHoldings.map(h => ({ ...h, hidden: true }));
      const result = calculateVisibleTotals(allHiddenHoldings);
      
      expect(result.invested).toBe(0);
      expect(result.curVal).toBe(0);
      expect(result.pl).toBe(0);
      expect(result.plPercent).toBe(0);
      expect(result.dayChg).toBe(0);
    });
  });

  describe('day change calculation edge cases', () => {
    it('should handle positive day changes correctly', () => {
      const positiveHoldings: Holding[] = [
        {
          ...mockHoldings[0],
          dayChg: 5.0,
          invested: 2000
        }
      ];
      
      const result = calculateTotals(positiveHoldings);
      expect(result.dayChg).toBe(5.0); // Should equal the holding's day change
    });

    it('should handle negative day changes correctly', () => {
      const negativeHoldings: Holding[] = [
        {
          ...mockHoldings[1],
          dayChg: -3.0,
          invested: 5000
        }
      ];
      
      const result = calculateTotals(negativeHoldings);
      expect(result.dayChg).toBe(-3.0); // Should equal the holding's day change
    });

    it('should handle mixed day changes correctly', () => {
      const mixedHoldings: Holding[] = [
        {
          ...mockHoldings[0],
          dayChg: 2.0,
          invested: 1000
        },
        {
          ...mockHoldings[1],
          dayChg: -1.0,
          invested: 2000
        }
      ];
      
      const result = calculateTotals(mixedHoldings);
      // Manual calculation:
      // Weighted: (2.0 * 1000/100) + (-1.0 * 2000/100) = 20 - 20 = 0
      // Percentage: (0 / 3000) * 100 = 0
      expect(Math.abs(result.dayChg)).toBeLessThan(0.01);
    });
  });

  describe('P&L percentage calculation edge cases', () => {
    it('should handle positive P&L correctly', () => {
      const profitableHoldings: Holding[] = [
        {
          ...mockHoldings[0],
          pl: 500,
          invested: 1000,
          curVal: 1500
        }
      ];
      
      const result = calculateTotals(profitableHoldings);
      expect(result.plPercent).toBe(50); // (500/1000)*100
    });

    it('should handle negative P&L correctly', () => {
      const losingHoldings: Holding[] = [
        {
          ...mockHoldings[2],
          pl: -200,
          invested: 1000,
          curVal: 800
        }
      ];
      
      const result = calculateTotals(losingHoldings);
      expect(result.plPercent).toBe(-20); // (-200/1000)*100
    });

    it('should handle zero investment edge case', () => {
      const zeroInvestmentHoldings: Holding[] = [
        {
          ...mockHoldings[3],
          invested: 0,
          pl: 0,
          curVal: 0
        }
      ];
      
      const result = calculateTotals(zeroInvestmentHoldings);
      expect(result.plPercent).toBe(0); // Should not divide by zero
    });
  });
});

describe('CSV/JSON Parser', () => {
  describe('parseHoldingsCSV', () => {
    // Mock fs for testing
    const mockFs = require('fs');
    const originalReadFileSync = mockFs.readFileSync;

    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
    });

    afterEach(() => {
      mockFs.readFileSync = originalReadFileSync;
    });

    it('should parse JSON API response format correctly', () => {
      const mockJsonData = {
        status: 'success',
        data: [
          {
            tradingsymbol: 'AAPL',
            quantity: 10,
            average_price: 150,
            last_price: 160,
            pnl: 100,
            day_change_percentage: 2.5
          },
          {
            tradingsymbol: 'GOOGL',
            quantity: 5,
            average_price: 2000,
            last_price: 2100,
            pnl: 500,
            day_change_percentage: -1.5
          }
        ]
      };

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockJsonData));

      const holdings = parseHoldingsCSV();

      expect(holdings).toHaveLength(2);

      // Check first holding
      expect(holdings[0]).toMatchObject({
        instrument: 'AAPL',
        quantity: 10,
        avgCost: 150,
        ltp: 160,
        invested: 1500, // 10 * 150
        curVal: 1600,   // 10 * 160
        pl: 100,
        netChg: 6.666666666666667, // (100 / 1500) * 100
        dayChg: 2.5,
        tags: [],
        hidden: false,
        customValue: 160,
        targetAvgCost: 150
      });

      // Check second holding
      expect(holdings[1]).toMatchObject({
        instrument: 'GOOGL',
        quantity: 5,
        avgCost: 2000,
        ltp: 2100,
        invested: 10000, // 5 * 2000
        curVal: 10500,   // 5 * 2100
        pl: 500,
        netChg: 5,       // (500 / 10000) * 100
        dayChg: -1.5,
        tags: [],
        hidden: false,
        customValue: 2100,
        targetAvgCost: 2000
      });
    });

    it('should fall back to CSV parsing when content is not valid JSON', () => {
      const mockCsvData = `Instrument,Qty,Avg Cost,LTP,Invested,Cur Val,P&L,Net Chg %,Day Chg %
AAPL,10,150,160,1500,1600,100,6.67,2.5
GOOGL,5,2000,2100,10000,10500,500,5.0,-1.5`;

      mockFs.readFileSync = jest.fn().mockReturnValue(mockCsvData);

      const holdings = parseHoldingsCSV();

      expect(holdings).toHaveLength(2);
      expect(holdings[0].instrument).toBe('AAPL');
      expect(holdings[1].instrument).toBe('GOOGL');
    });

    it('should handle CSV files correctly', () => {
      const mockCsvData = `Instrument,Qty,Avg Cost,LTP,Invested,Cur Val,P&L,Net Chg %,Day Chg %
TSLA,20,200,180,4000,3600,-400,-10.0,3.0`;

      mockFs.readFileSync = jest.fn().mockReturnValue(mockCsvData);

      const holdings = parseHoldingsCSV();

      expect(holdings).toHaveLength(1);
      expect(holdings[0]).toMatchObject({
        instrument: 'TSLA',
        quantity: 20,
        avgCost: 200,
        ltp: 180,
        invested: 4000,
        curVal: 3600,
        pl: -400,
        netChg: -10.0,
        dayChg: 3.0,
        tags: [],
        hidden: false,
        customValue: 180,
        targetAvgCost: 200
      });
    });

    it('should handle quoted CSV fields', () => {
      const mockCsvData = `"Instrument","Qty","Avg Cost","LTP","Invested","Cur Val","P&L","Net Chg %","Day Chg %"
"AAPL","10","150","160","1500","1600","100","6.67","2.5"`;

      mockFs.readFileSync = jest.fn().mockReturnValue(mockCsvData);

      const holdings = parseHoldingsCSV();

      expect(holdings).toHaveLength(1);
      expect(holdings[0].instrument).toBe('AAPL');
      expect(holdings[0].quantity).toBe(10);
    });

    it('should throw error when neither CSV nor JSON file exists', () => {
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => parseHoldingsCSV()).toThrow('Neither holdings.csv nor holdings.json found');
    });

    it('should handle zero investment correctly in JSON parsing', () => {
      const mockJsonData = {
        status: 'success',
        data: [
          {
            tradingsymbol: 'ZERO',
            quantity: 0,
            average_price: 100,
            last_price: 100,
            pnl: 0,
            day_change_percentage: 0
          }
        ]
      };

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockJsonData));

      const holdings = parseHoldingsCSV();

      expect(holdings).toHaveLength(1);
      expect(holdings[0].netChg).toBe(0); // Should handle division by zero
    });

    it('should parse JSON API response with all expected fields', () => {
      const mockJsonData = {
        status: 'success',
        data: [
          {
            tradingsymbol: 'COMPLETE',
            quantity: 5,
            average_price: 200,
            last_price: 220,
            pnl: 100,
            day_change_percentage: 1.5
          }
        ]
      };

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockJsonData));

      const holdings = parseHoldingsCSV();

      expect(holdings).toHaveLength(1);
      const holding = holdings[0];
      expect(holding.instrument).toBe('COMPLETE');
      expect(holding.quantity).toBe(5);
      expect(holding.avgCost).toBe(200);
      expect(holding.ltp).toBe(220);
      expect(holding.invested).toBe(1000); // 5 * 200
      expect(holding.curVal).toBe(1100);   // 5 * 220
      expect(holding.pl).toBe(100);
      expect(holding.netChg).toBe(10);     // (100 / 1000) * 100
      expect(holding.dayChg).toBe(1.5);
      expect(holding.tags).toEqual([]);
      expect(holding.hidden).toBe(false);
      expect(holding.customValue).toBe(220);
      expect(holding.targetAvgCost).toBe(200);
    });
  });
});