'use client';

import { useState, useEffect } from 'react';
import { Holding, Totals } from '@/types/holding';

interface StoredData {
  holdings: Holding[];
  hiddenInstruments: string[];
  instrumentTags: Record<string, string[]>;
  theme: 'light' | 'dark';
}

interface HoldingsTableProps {
  holdings: Holding[];
  totals: Totals;
}

export default function HoldingsTable({ holdings: initialHoldings, totals: initialTotals }: HoldingsTableProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load stored data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('holdingsData');
    if (stored) {
      try {
        const data: StoredData = JSON.parse(stored);
        if (data.holdings && data.holdings.length > 0) {
          setHoldings(data.holdings.map(holding => ({
            ...holding,
            hidden: data.hiddenInstruments.includes(holding.instrument),
            tags: data.instrumentTags[holding.instrument] || []
          })));
        }
        setTheme(data.theme || 'light');
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    }
  }, []);

  // Load stored data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('holdingsData');
    if (stored) {
      try {
        const data: StoredData = JSON.parse(stored);
        setHoldings(prev => prev.map(holding => ({
          ...holding,
          hidden: data.hiddenInstruments.includes(holding.instrument),
          tags: data.instrumentTags[holding.instrument] || []
        })));
        setTheme(data.theme || 'light');
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    }
  }, []);

  // Save to localStorage whenever holdings or theme change
  useEffect(() => {
    const data: StoredData = {
      holdings: holdings.map(h => ({
        ...h,
        hidden: false, // Don't persist hidden state in holdings array
        tags: [] // Don't persist tags in holdings array
      })),
      hiddenInstruments: holdings.filter(h => h.hidden).map(h => h.instrument),
      instrumentTags: holdings.reduce((acc, h) => {
        if (h.tags.length > 0) {
          acc[h.instrument] = h.tags;
        }
        return acc;
      }, {} as Record<string, string[]>),
      theme
    };
    localStorage.setItem('holdingsData', JSON.stringify(data));
  }, [holdings, theme]);

  const filteredHoldings = selectedTag 
    ? holdings.filter(h => h.tags.includes(selectedTag))
    : holdings;

  const totals = selectedTag
    ? calculateTotals(filteredHoldings.filter(h => !h.hidden))
    : calculateTotals(holdings.filter(h => !h.hidden));

  const allTags = Array.from(new Set(holdings.flatMap(h => h.tags)));

  function calculateTotals(holdings: Holding[]): Totals {
    return holdings.reduce(
      (acc, h) => ({
        invested: acc.invested + h.invested,
        curVal: acc.curVal + h.curVal,
        pl: acc.pl + h.pl,
        plPercent: 0
      }),
      { invested: 0, curVal: 0, pl: 0, plPercent: 0 }
    );
  }

  if (totals.invested > 0) {
    totals.plPercent = (totals.pl / totals.invested) * 100;
  }

  const toggleHidden = (instrument: string) => {
    setHoldings(prev => prev.map(h => 
      h.instrument === instrument ? { ...h, hidden: !h.hidden } : h
    ));
  };

  const addTag = (instrument: string) => {
    if (!newTag.trim()) return;
    
    setHoldings(prev => prev.map(h => 
      h.instrument === instrument 
        ? { ...h, tags: [...h.tags, newTag.trim()] }
        : h
    ));
    setNewTag('');
  };

  const removeTag = (instrument: string, tagToRemove: string) => {
    setHoldings(prev => prev.map(h => 
      h.instrument === instrument 
        ? { ...h, tags: h.tags.filter(t => t !== tagToRemove) }
        : h
    ));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      const newHoldings: Holding[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 9) continue;
        
        const instrument = String(row[0] || '').replace(/"/g, '');
        if (!instrument) continue;
        
        // Get existing hidden state and tags from current holdings
        const existingHolding = holdings.find(h => h.instrument === instrument);
        
        newHoldings.push({
          instrument,
          quantity: parseFloat(row[1]) || 0,
          avgCost: parseFloat(row[2]) || 0,
          ltp: parseFloat(row[3]) || 0,
          invested: parseFloat(row[4]) || 0,
          curVal: parseFloat(row[5]) || 0,
          pl: parseFloat(row[6]) || 0,
          netChg: parseFloat(row[7]) || 0,
          dayChg: parseFloat(row[8]) || 0,
          tags: existingHolding?.tags || [],
          hidden: existingHolding?.hidden || false
        });
      }
      
      if (newHoldings.length === 0) {
        throw new Error('No valid data found in file');
      }
      
      // Reset holdings with new data (preserving existing tags/hidden states for matching instruments)
      setHoldings(newHoldings);
      alert(`Successfully loaded ${newHoldings.length} holdings from ${file.name}. Previous data has been replaced.`);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure it has correct format: Instrument, Qty, Avg Cost, LTP, Invested, Cur Val, P&L, Net Chg %, Day Chg %`);
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  const cardClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';

  const headerClasses = theme === 'dark'
    ? 'bg-gray-900 text-gray-300'
    : 'bg-gray-50 text-gray-700';

  const textClasses = theme === 'dark'
    ? 'text-gray-300'
    : 'text-gray-600';

  const secondaryTextClasses = theme === 'dark'
    ? 'text-gray-400'
    : 'text-gray-500';

  return (
    <div className={`min-h-screen ${themeClasses} p-6 max-w-7xl mx-auto`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Investment Holdings</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className={`text-sm font-medium ${textClasses} whitespace-nowrap`}>
              Upload CSV/Excel:
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className={`text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium flex-1 ${
                theme === 'dark' 
                  ? 'file:bg-gray-700 file:text-white hover:file:bg-gray-600' 
                  : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
              }`}
            />
            {isUploading && <span className="text-sm whitespace-nowrap">Processing...</span>}
          </div>
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      {/* Show message when no data is loaded */}
      {holdings.length === 0 && (
        <div className={`text-center py-12 px-6 rounded-lg border-2 border-dashed ${
          theme === 'dark' 
            ? 'border-gray-600 bg-gray-800' 
            : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="mb-4">
            <svg className={`mx-auto h-12 w-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            No Holdings Data
          </h3>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Upload a CSV or Excel file to get started with your investment portfolio tracking.
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            Expected format: Instrument, Qty, Avg Cost, LTP, Invested, Cur Val, P&L, Net Chg %, Day Chg %
          </p>
        </div>
      )}
      
      {/* Summary Cards - Only show when there's data */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-lg shadow-lg p-6 border ${cardClasses}`}>
            <h3 className={`text-sm font-medium mb-2 ${secondaryTextClasses}`}>Total Invested</h3>
            <p className="text-2xl font-bold">₹{totals.invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className={`rounded-lg shadow-lg p-6 border ${cardClasses}`}>
            <h3 className={`text-sm font-medium mb-2 ${secondaryTextClasses}`}>Current Value</h3>
            <p className="text-2xl font-bold">₹{totals.curVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className={`rounded-lg shadow-lg p-6 border ${cardClasses}`}>
            <h3 className={`text-sm font-medium mb-2 ${secondaryTextClasses}`}>P&L</h3>
            <p className={`text-2xl font-bold ${totals.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{totals.pl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className={`rounded-lg shadow-lg p-6 border ${cardClasses}`}>
            <h3 className={`text-sm font-medium mb-2 ${secondaryTextClasses}`}>P&L %</h3>
            <p className={`text-2xl font-bold ${totals.plPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totals.plPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Tag Filter - Only show when there's data */}
      {holdings.length > 0 && (
        <div className="mb-6">
          <label className={`block text-sm font-medium ${textClasses} mb-2`}>Filter by Tag</label>
          <select 
            value={selectedTag} 
            onChange={(e) => setSelectedTag(e.target.value)}
            className={`block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-800 text-white' 
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="">All Holdings</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      )}

      {/* Holdings Table - Only show when there's data */}
      {holdings.length > 0 && (isMobile ? (
        // Mobile Card Layout
        <div className="space-y-4">
          {filteredHoldings.map((holding) => (
            <div 
              key={holding.instrument} 
              className={`rounded-lg shadow-md border p-4 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              } ${holding.hidden ? 'opacity-50' : ''}`}
            >
              {/* Header with Instrument and Action */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{holding.instrument}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm ${secondaryTextClasses}`}>
                      Qty: {holding.quantity}
                    </span>
                    <span className={`text-sm ${secondaryTextClasses}`}>
                      @ ₹{holding.avgCost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleHidden(holding.instrument)}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                    holding.hidden 
                      ? theme === 'dark' 
                        ? 'bg-green-900 text-green-300 hover:bg-green-800' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                      : theme === 'dark'
                        ? 'bg-red-900 text-red-300 hover:bg-red-800'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                  title={holding.hidden ? "Include in totals" : "Exclude from totals"}
                >
                  {holding.hidden ? 'Include' : 'Exclude'}
                </button>
              </div>

              {/* Financial Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className={`text-xs ${secondaryTextClasses}`}>LTP</span>
                  <p className="font-medium">₹{holding.ltp.toFixed(2)}</p>
                </div>
                <div>
                  <span className={`text-xs ${secondaryTextClasses}`}>Invested</span>
                  <p className="font-medium">₹{holding.invested.toFixed(2)}</p>
                </div>
                <div>
                  <span className={`text-xs ${secondaryTextClasses}`}>Current Value</span>
                  <p className="font-medium">₹{holding.curVal.toFixed(2)}</p>
                </div>
                <div>
                  <span className={`text-xs ${secondaryTextClasses}`}>P&L</span>
                  <p className={`font-medium ${holding.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{holding.pl.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Changes Row */}
              <div className="flex justify-between mb-3">
                <div className="flex-1">
                  <span className={`text-xs ${secondaryTextClasses}`}>Net Change</span>
                  <p className={`text-sm font-medium ${holding.netChg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.netChg.toFixed(2)}%
                  </p>
                </div>
                <div className="flex-1">
                  <span className={`text-xs ${secondaryTextClasses}`}>Day Change</span>
                  <p className={`text-sm font-medium ${holding.dayChg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.dayChg.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Tags Section */}
              <div>
                <span className={`text-xs ${secondaryTextClasses}`}>Tags</span>
                <div className="mt-1 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {holding.tags.map((tag) => (
                      <span 
                        key={tag}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          theme === 'dark' 
                            ? 'bg-blue-900 text-blue-300' 
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(holding.instrument, tag)}
                          className={`ml-1 ${theme === 'dark' ? 'text-blue-400 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      className={`flex-1 px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && addTag(holding.instrument)}
                    />
                    <button
                      onClick={() => addTag(holding.instrument)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop Table Layout
        <div className={`rounded-lg shadow-lg overflow-hidden border ${cardClasses} overflow-x-auto`}>
          <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={headerClasses}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Instrument</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Avg Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">LTP</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Invested</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cur Val</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Net Chg %</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Day Chg %</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[200px]">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.map((holding) => (
                <tr key={holding.instrument} className={`${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-50'
                } ${holding.hidden ? 'opacity-50' : ''} ${
                  theme === 'dark' 
                    ? 'bg-gray-800' 
                    : 'bg-white'
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span>{holding.instrument}</span>
                      <button
                        onClick={() => toggleHidden(holding.instrument)}
                        className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                          holding.hidden 
                            ? theme === 'dark' 
                              ? 'bg-green-900 text-green-300 hover:bg-green-800' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                            : theme === 'dark'
                              ? 'bg-red-900 text-red-300 hover:bg-red-800'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                        title={holding.hidden ? "Include in totals" : "Exclude from totals"}
                      >
                        {holding.hidden ? 'Include' : 'Exclude'}
                      </button>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    {holding.quantity}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    ₹{holding.avgCost.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    ₹{holding.ltp.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    ₹{holding.invested.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    ₹{holding.curVal.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${holding.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{holding.pl.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${holding.netChg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.netChg.toFixed(2)}%
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${holding.dayChg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.dayChg.toFixed(2)}%
                  </td>
                  <td className={`px-6 py-4 text-sm ${secondaryTextClasses} max-w-xs`}>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {holding.tags.map((tag) => (
                          <span 
                            key={tag}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              theme === 'dark' 
                                ? 'bg-blue-900 text-blue-300' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(holding.instrument, tag)}
                              className={`ml-1 ${theme === 'dark' ? 'text-blue-400 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1 items-center">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag"
                          className={`flex-1 px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            theme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          }`}
                          onKeyPress={(e) => e.key === 'Enter' && addTag(holding.instrument)}
                        />
                        <button
                          onClick={() => addTag(holding.instrument)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}