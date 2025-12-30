'use client';

import { useState, useEffect } from 'react';
import { Holding, Totals } from '@/types/holding';

interface StoredData {
  holdings: Holding[];
  hiddenInstruments: string[];
  instrumentTags: Record<string, string[]>;
  theme: 'light' | 'dark';
  hiddenQuickViewTags: string[];
}

interface HoldingsTableProps {
  holdings: Holding[];
  totals: Totals;
}

type SortField = 'instrument' | 'quantity' | 'avgCost' | 'ltp' | 'invested' | 'curVal' | 'pl' | 'netChg' | 'dayChg';
type SortDirection = 'asc' | 'desc';

export default function HoldingsTable({ holdings: initialHoldings, totals: initialTotals }: HoldingsTableProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortField, setSortField] = useState<SortField>('instrument');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortFieldQuick, setSortFieldQuick] = useState<'instrument' | 'netChg' | 'dayChg' | 'invested'>('netChg');
  const [sortDirectionQuick, setSortDirectionQuick] = useState<SortDirection>('desc');
  const [quickViewMode, setQuickViewMode] = useState<'netChg' | 'dayChg'>('netChg');
  const [quickViewLayout, setQuickViewLayout] = useState<'expanded' | 'minimal'>('expanded');
  const [quickViewExpanded, setQuickViewExpanded] = useState(true);
  const [hiddenQuickViewTags, setHiddenQuickViewTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [showUntaggedInBulk, setShowUntaggedInBulk] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTagDropdown && !(event.target as Element).closest('.tag-dropdown-container')) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagDropdown]);

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
            tags: data.instrumentTags[holding.instrument] || [],
            customValue: holding.customValue ?? holding.ltp,
            targetAvgCost: holding.targetAvgCost ?? holding.avgCost
          })));
        }
        setTheme(data.theme || 'light');
        setHiddenQuickViewTags(data.hiddenQuickViewTags || []);
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
        setHiddenQuickViewTags(data.hiddenQuickViewTags || []);
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
      theme,
      hiddenQuickViewTags
    };
    localStorage.setItem('holdingsData', JSON.stringify(data));
  }, [holdings, theme]);

  const filteredHoldings = selectedTag 
    ? holdings.filter(h => h.tags.includes(selectedTag))
    : holdings;

  // Apply sorting
  // Apply search filter
  const searchedHoldings = searchTerm 
    ? filteredHoldings.filter(h => 
        h.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : filteredHoldings;

  // Apply sorting
  const sortedHoldings = [...searchedHoldings].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case 'instrument':
        aValue = a.instrument.toLowerCase();
        bValue = b.instrument.toLowerCase();
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case 'avgCost':
        aValue = a.avgCost;
        bValue = b.avgCost;
        break;
      case 'ltp':
        aValue = a.ltp;
        bValue = b.ltp;
        break;
      case 'invested':
        aValue = a.invested;
        bValue = b.invested;
        break;
      case 'curVal':
        aValue = a.curVal;
        bValue = b.curVal;
        break;
      case 'pl':
        aValue = a.pl;
        bValue = b.pl;
        break;
      case 'netChg':
        aValue = a.netChg;
        bValue = b.netChg;
        break;
      case 'dayChg':
        aValue = a.dayChg;
        bValue = b.dayChg;
        break;
      default:
        aValue = a.instrument.toLowerCase();
        bValue = b.instrument.toLowerCase();
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Filter holdings for Quick View (exclude those with hidden tags)
  const quickViewFilteredHoldings = searchedHoldings.filter(holding =>
    !hiddenQuickViewTags.some(hiddenTag => holding.tags.includes(hiddenTag))
  );

  // Quick view sorting
  const sortedHoldingsQuick = [...quickViewFilteredHoldings].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortFieldQuick) {
      case 'instrument':
        aValue = a.instrument.toLowerCase();
        bValue = b.instrument.toLowerCase();
        break;
      case 'netChg':
        aValue = a.netChg;
        bValue = b.netChg;
        break;
      case 'dayChg':
        aValue = a.dayChg;
        bValue = b.dayChg;
        break;
      case 'invested':
        aValue = a.invested;
        bValue = b.invested;
        break;
      default:
        aValue = a.netChg;
        bValue = b.netChg;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirectionQuick === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirectionQuick === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const totals = selectedTag
    ? calculateTotals(sortedHoldings.filter(h => !h.hidden))
    : calculateTotals(holdings.filter(h => !h.hidden));

  const hiddenTotals = calculateTotals(holdings.filter(h => h.hidden));

  const allTags = Array.from(new Set(holdings.flatMap(h => h.tags)));

  const tagTotals: Record<string, Totals> = {};
  allTags.forEach(tag => {
    const holdingsWithTag = holdings.filter(h => h.tags.includes(tag));
    tagTotals[tag] = calculateTotals(holdingsWithTag);
  });

  const allHoldingsTotals = calculateTotals(holdings);

  // Filter holdings for bulk select with search and untagged filter
  const bulkFilterHoldings = () => {
    return sortedHoldings.filter(holding => {
      const matchesSearch = portfolioSearch === '' || 
        holding.instrument.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
        holding.tags.some(tag => tag.toLowerCase().includes(portfolioSearch.toLowerCase()));
      
      const matchesUntaggedFilter = !showUntaggedInBulk || holding.tags.length === 0;
      
      return matchesSearch && matchesUntaggedFilter;
    });
  };

  function calculateTotals(holdings: Holding[]): Totals {
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

  function calculateSharesToBuy(holding: Holding): number {
    const { quantity, avgCost, customValue, targetAvgCost } = holding;
    if (customValue === targetAvgCost) return 0;
    const numerator = (targetAvgCost * quantity) - (avgCost * quantity);
    const denominator = customValue - targetAvgCost;
    const shares = numerator / denominator;
    return Math.ceil(shares); // Round up to next whole share
  }

  if (totals.invested > 0) {
    totals.plPercent = (totals.pl / totals.invested) * 100;
  }

  if (hiddenTotals.invested > 0) {
    hiddenTotals.plPercent = (hiddenTotals.pl / hiddenTotals.invested) * 100;
  }

  Object.values(tagTotals).forEach(tagTotal => {
    if (tagTotal.invested > 0) {
      tagTotal.plPercent = (tagTotal.pl / tagTotal.invested) * 100;
    }
  });

  const toggleHidden = (instrument: string) => {
    setHoldings(prev => prev.map(h => 
      h.instrument === instrument ? { ...h, hidden: !h.hidden } : h
    ));
  };

  const addTag = (instrument: string) => {
    const tagValue = newTagInputs[instrument]?.trim();
    if (!tagValue) return;

    setHoldings(prev => prev.map(h =>
      h.instrument === instrument
        ? { ...h, tags: [...h.tags, tagValue] }
        : h
    ));
    setNewTagInputs(prev => ({ ...prev, [instrument]: '' }));
  };

  const removeTag = (instrument: string, tagToRemove: string) => {
    setHoldings(prev => prev.map(h => 
      h.instrument === instrument 
        ? { ...h, tags: h.tags.filter(t => t !== tagToRemove) }
        : h
    ));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSortQuick = (field: 'instrument' | 'netChg' | 'dayChg' | 'invested') => {
    if (sortFieldQuick === field) {
      setSortDirectionQuick(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortFieldQuick(field);
      setSortDirectionQuick('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc'
      ? <span className="text-blue-500">↑</span>
      : <span className="text-blue-500">↓</span>;
  };

  const getSortIconQuick = (field: 'instrument' | 'netChg' | 'dayChg' | 'invested') => {
    if (sortFieldQuick !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirectionQuick === 'asc'
      ? <span className="text-blue-500">↑</span>
      : <span className="text-blue-500">↓</span>;
  };

  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [tableWidth, setTableWidth] = useState(80); // in rem, 7xl is about 80rem
  const [excludedExpanded, setExcludedExpanded] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const exportData = () => {
    const data: StoredData = {
      holdings: holdings.map(h => ({
        ...h,
        hidden: false,
        tags: []
      })),
      hiddenInstruments: holdings.filter(h => h.hidden).map(h => h.instrument),
      instrumentTags: holdings.reduce((acc, h) => {
        if (h.tags.length > 0) {
          acc[h.instrument] = h.tags;
        }
        return acc;
      }, {} as Record<string, string[]>),
      theme,
      hiddenQuickViewTags
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    setExportJson(jsonString);
    setShowExportModal(true);
    setCopySuccess(false);
  };

  const importDataFromText = () => {
    if (!importJson.trim()) {
      alert('Please paste JSON data in the text area.');
      return;
    }

    try {
      const data: StoredData = JSON.parse(importJson);
      
      if (data.holdings && Array.isArray(data.holdings)) {
        const importedHoldings = data.holdings.map(holding => ({
          ...holding,
          hidden: data.hiddenInstruments?.includes(holding.instrument) || false,
          tags: data.instrumentTags?.[holding.instrument] || []
        }));
        
        setHoldings(importedHoldings);
        setTheme(data.theme || 'light');
        setHiddenQuickViewTags(data.hiddenQuickViewTags || []);
        setImportJson('');
        setShowImportModal(false);
        alert(`Successfully imported ${importedHoldings.length} holdings with settings.`);
      } else {
        throw new Error('Invalid JSON format - missing holdings array');
      }
    } catch (error) {
      alert(`Error importing data: ${error instanceof Error ? error.message : 'Invalid JSON format'}. Please ensure it's a valid holdings backup file.`);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard. Please copy manually.');
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('holdingsData');
      setHoldings([]);
      setSelectedTag('');
      setSearchTerm('');
      setHiddenQuickViewTags([]);
      setSelectedInstruments(new Set());
      setBulkSelectionMode(false);
      alert('All data has been cleared.');
    }
  };

  const toggleBulkSelection = (instrument: string) => {
    setSelectedInstruments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(instrument)) {
        newSet.delete(instrument);
      } else {
        newSet.add(instrument);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleInstruments = sortedHoldings.map(h => h.instrument);
    setSelectedInstruments(new Set(visibleInstruments));
  };

  const clearSelection = () => {
    setSelectedInstruments(new Set());
  };

  const addBulkTag = () => {
    const tagValue = bulkTagInput.trim();
    if (!tagValue || selectedInstruments.size === 0) return;

    setHoldings(prev => prev.map(holding => {
      if (selectedInstruments.has(holding.instrument)) {
        const existingTags = holding.tags || [];
        if (!existingTags.includes(tagValue)) {
          return { ...holding, tags: [...existingTags, tagValue] };
        }
      }
      return holding;
    }));

    setBulkTagInput('');
    clearSelection();
    setBulkSelectionMode(false);
  };

  const removeBulkTag = (tagToRemove: string) => {
    if (selectedInstruments.size === 0) return;

    setHoldings(prev => prev.map(holding => {
      if (selectedInstruments.has(holding.instrument)) {
        return { 
          ...holding, 
          tags: holding.tags.filter(t => t !== tagToRemove) 
        };
      }
      return holding;
    }));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const updateCustomValue = (instrument: string, value: number) => {
    setHoldings(prev => prev.map(h =>
      h.instrument === instrument ? { ...h, customValue: value } : h
    ));
  };

  const updateTargetAvgCost = (instrument: string, value: number) => {
    setHoldings(prev => prev.map(h =>
      h.instrument === instrument ? { ...h, targetAvgCost: value } : h
    ));
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
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null)[][];
      
      const newHoldings: Holding[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 9) continue;
        
        const row0 = row[0] ?? '';
        const instrument = String(row0).replace(/"/g, '');
        if (!instrument) continue;

        // Get existing hidden state and tags from current holdings
        const existingHolding = holdings.find(h => h.instrument === instrument);

        const avgCost = parseFloat(String(row[2] ?? 0)) || 0;
        const ltp = parseFloat(String(row[3] ?? 0)) || 0;
        const netChg = parseFloat(String(row[7] ?? 0)) || 0;
        const netChange = netChg / 100;
        newHoldings.push({
          instrument,
          quantity: parseFloat(String(row[1] ?? 0)) || 0,
          avgCost,
          ltp,
          invested: parseFloat(String(row[4] ?? 0)) || 0,
          curVal: parseFloat(String(row[5] ?? 0)) || 0,
          pl: parseFloat(String(row[6] ?? 0)) || 0,
          netChg,
          dayChg: parseFloat(String(row[8] ?? 0)) || 0,
          tags: existingHolding?.tags || [],
          hidden: existingHolding?.hidden || false,
          customValue: ltp,
           targetAvgCost: avgCost * (1 + netChange / 2)
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
    <div className={`min-h-screen ${themeClasses} p-6`} style={{ maxWidth: `${tableWidth}rem`, margin: '0 auto' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Investment Holdings</h1>
          {holdings.length > 0 && (
            <p className={`text-sm mt-1 ${secondaryTextClasses}`}>
              {holdings.length} instruments • {holdings.filter(h => !h.hidden).length} visible • {holdings.filter(h => h.hidden).length} hidden
            </p>
          )}
        </div>
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
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isSettingsOpen ? '✖️ Close' : '⚙️ Settings'}
          </button>
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

        {/* Width Adjustment Progress Bar */}
        <div className="mb-6">
          <input
            type="range"
            min="20"
            max="100"
            value={tableWidth}
            onChange={(e) => setTableWidth(Number(e.target.value))}
            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700`}
          />
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

      {/* Collapsible Settings Section */}
      <div className={`mb-6 border rounded-lg overflow-hidden transition-all duration-300 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`w-full px-4 py-3 text-left font-medium flex justify-between items-center transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
          }`}
        >
          <span>⚙️ Data Management</span>
          <span className={`transform transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {isSettingsOpen && (
          <div className={`p-6 space-y-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Export Section */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                📤 Export Data
              </h3>
              <p className={`text-sm mb-3 ${secondaryTextClasses}`}>
                Export all your holdings, tags, and settings as JSON.
              </p>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Show Backup JSON
              </button>
            </div>

            {/* Import Section */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                📥 Import Data
              </h3>
              <p className={`text-sm mb-3 ${secondaryTextClasses}`}>
                Import holdings and settings from JSON. This will replace all current data.
              </p>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Import from JSON
              </button>
            </div>

            {/* Clear Data Section */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                🗑️ Clear Data
              </h3>
              <p className={`text-sm mb-3 ${secondaryTextClasses}`}>
                Permanently delete all holdings and settings from this device.
              </p>
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Clear All Data
              </button>
            </div>

            {/* Statistics */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                📊 Statistics
              </h3>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm ${secondaryTextClasses}`}>
                <div>
                  <span className="font-medium">Total Instruments:</span> {holdings.length}
                </div>
                <div>
                  <span className="font-medium">Total Tags:</span> {allTags.length}
                </div>
                <div>
                  <span className="font-medium">Hidden Items:</span> {holdings.filter(h => h.hidden).length}
                </div>
                <div>
                  <span className="font-medium">Theme:</span> {theme === 'dark' ? 'Dark' : 'Light'}
                </div>
              </div>
           </div>


         </div>
       )}
      </div>

      {/* Search and Filter - Only show when there's data */}
      {holdings.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Bulk Selection Controls */}
          <div className={`rounded-lg border p-4 ${
            theme === 'dark' 
              ? 'border-gray-700 bg-gray-800' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setBulkSelectionMode(!bulkSelectionMode);
                    if (bulkSelectionMode) {
                      clearSelection();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    bulkSelectionMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {bulkSelectionMode ? '✓ Bulk Mode On' : '☑ Bulk Select'}
                </button>
                
                {bulkSelectionMode && (
                  <>
                    <button
                      onClick={() => setSelectedInstruments(new Set(bulkFilterHoldings().map(h => h.instrument)))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Select All ({bulkFilterHoldings().length})
                    </button>
                    <button
                      onClick={clearSelection}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Clear Selection
                    </button>
                    <span className={`text-sm ${secondaryTextClasses}`}>
                      {selectedInstruments.size} selected
                    </span>
                  </>
                )}
              </div>

              {bulkSelectionMode && selectedInstruments.size > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bulkTagInput}
                    onChange={(e) => setBulkTagInput(e.target.value)}
                    placeholder="Enter tag to add..."
                    className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    onKeyPress={(e) => e.key === 'Enter' && addBulkTag()}
                  />
                  <button
                    onClick={addBulkTag}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    Add Tag
                  </button>
                </div>
              )}

              {/* Search and Untagged Filter for Bulk Selection */}
              {bulkSelectionMode && (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={portfolioSearch}
                      onChange={(e) => setPortfolioSearch(e.target.value)}
                      placeholder="Search holdings for bulk selection..."
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className={`flex items-center gap-2 cursor-pointer ${textClasses}`}>
                      <input
                        type="checkbox"
                        checked={showUntaggedInBulk}
                        onChange={(e) => setShowUntaggedInBulk(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Show Untagged Only</span>
                    </label>
                    <button
                      onClick={() => setSelectedInstruments(new Set(bulkFilterHoldings().map(h => h.instrument)))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Select Filtered ({bulkFilterHoldings().length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected instruments display */}
            {bulkSelectionMode && selectedInstruments.size > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className={`text-sm ${secondaryTextClasses} mb-2`}>Selected instruments:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedInstruments).map(instrument => (
                    <span
                      key={instrument}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        theme === 'dark'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {instrument}
                      <button
                        onClick={() => toggleBulkSelection(instrument)}
                        className={`ml-1 ${theme === 'dark' ? 'text-blue-400 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div>
            <label className={`block text-sm font-medium ${textClasses} mb-2`}>Search Instruments</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by instrument name or tag..."
              className={`block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Tag Filter */}
          <div>
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
        </div>
      )}

      {/* Totals Summary - Only show when there's data */}
      {holdings.length > 0 && (
        <div className="space-y-6">
          {/* Main Portfolio Summary */}
          <div className={`rounded-lg shadow-md border p-6 ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Portfolio Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className={`text-sm ${secondaryTextClasses}`}>Total Invested</p>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ₹{totals.invested.toFixed(2)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${secondaryTextClasses}`}>Current Value</p>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ₹{totals.curVal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${secondaryTextClasses}`}>Total P&L</p>
                <p className={`text-2xl font-bold ${totals.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{totals.pl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${secondaryTextClasses}`}>P&L %</p>
                <p className={`text-2xl font-bold ${totals.plPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.plPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Excluded Holdings Summary - Collapsible */}
          {holdings.filter(h => h.hidden).length > 0 && (
            <div className={`rounded-lg shadow-md border overflow-hidden ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <button
                onClick={() => setExcludedExpanded(!excludedExpanded)}
                className={`w-full px-6 py-4 text-left font-medium flex justify-between items-center transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-750 hover:bg-gray-700 text-white' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                }`}
              >
                <span className="text-xl">📊 Excluded Holdings Summary</span>
                <span className={`transform transition-transform duration-300 ${excludedExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {excludedExpanded && (
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className={`text-sm ${secondaryTextClasses}`}>Total Invested</p>
                      <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ₹{hiddenTotals.invested.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${secondaryTextClasses}`}>Current Value</p>
                      <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ₹{hiddenTotals.curVal.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${secondaryTextClasses}`}>Total P&L</p>
                      <p className={`text-2xl font-bold ${hiddenTotals.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{hiddenTotals.pl.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${secondaryTextClasses}`}>P&L %</p>
                      <p className={`text-2xl font-bold ${hiddenTotals.plPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {hiddenTotals.plPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm ${secondaryTextClasses}`}>
                      {holdings.filter(h => h.hidden).length} excluded holdings
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tag-Based Summaries - Collapsible */}
          {allTags.length > 0 && (
            <div className={`rounded-lg shadow-md border overflow-hidden ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className={`w-full px-6 py-4 text-left font-medium flex justify-between items-center transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-750 hover:bg-gray-700 text-white' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                }`}
              >
                <span className="text-xl">🏷️ Tag-Based Summaries</span>
                <span className={`transform transition-transform duration-300 ${tagsExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {tagsExpanded && (
                <div className="p-6">
                  <div className="space-y-4">
                    {allTags.map(tag => {
                      const tagTotal = tagTotals[tag];
                      if (tagTotal.invested === 0) return null;
                      return (
                        <div key={tag} className={`rounded-lg border p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                          <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            📌 {tag}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className={`text-sm ${secondaryTextClasses}`}>Total Invested</p>
                              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                ₹{tagTotal.invested.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm ${secondaryTextClasses}`}>Current Value</p>
                              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                ₹{tagTotal.curVal.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm ${secondaryTextClasses}`}>Total P&L</p>
                              <p className={`text-lg font-bold ${tagTotal.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{tagTotal.pl.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm ${secondaryTextClasses}`}>P&L %</p>
                              <p className={`text-lg font-bold ${tagTotal.plPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tagTotal.plPercent.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Complete Portfolio Summary - All Holdings Including Excluded */}
      {holdings.length > 0 && (
        <div className={`mt-8 rounded-lg shadow-md border p-6 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            📊 Complete Portfolio Summary (All Holdings)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className={`text-sm ${secondaryTextClasses}`}>Total Invested</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                ₹{allHoldingsTotals.invested.toFixed(2)}
              </p>
            </div>
            <div>
              <p className={`text-sm ${secondaryTextClasses}`}>Current Value</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                ₹{allHoldingsTotals.curVal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className={`text-sm ${secondaryTextClasses}`}>Total P&L</p>
              <p className={`text-2xl font-bold ${allHoldingsTotals.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{allHoldingsTotals.pl.toFixed(2)}
              </p>
            </div>
            <div>
              <p className={`text-sm ${secondaryTextClasses}`}>P&L %</p>
              <p className={`text-2xl font-bold ${allHoldingsTotals.plPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {allHoldingsTotals.plPercent.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className={`text-sm ${secondaryTextClasses}`}>Day's Change</p>
              <p className={`text-2xl font-bold ${allHoldingsTotals.dayChg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {allHoldingsTotals.dayChg.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${secondaryTextClasses}`}>
              {holdings.length} total holdings • {holdings.filter(h => !h.hidden).length} visible • {holdings.filter(h => h.hidden).length} excluded
            </p>
          </div>
        </div>
      )}

      {/* Quick View - Only show when there's data */}
      {holdings.length > 0 && (
        <div className={`mt-8 mb-6 rounded-lg border overflow-hidden ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Quick View ({sortedHoldingsQuick.length}{hiddenQuickViewTags.length > 0 ? ` of ${searchedHoldings.length}` : ''} holdings)
            </h2>
            <button
              onClick={() => setQuickViewExpanded(!quickViewExpanded)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {quickViewExpanded ? 'Collapse' : 'Expand'}
              <span className={`transform transition-transform duration-200 ${quickViewExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>

          {quickViewExpanded && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div></div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Layout Toggle */}
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setQuickViewLayout('expanded')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    quickViewLayout === 'expanded'
                      ? theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Expanded
                </button>
                <button
                  onClick={() => setQuickViewLayout('minimal')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    quickViewLayout === 'minimal'
                      ? theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Minimal
                </button>
              </div>

              {/* Change Type Toggle */}
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setQuickViewMode('netChg')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    quickViewMode === 'netChg'
                      ? theme === 'dark'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-600 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Net Change
                </button>
                <button
                  onClick={() => setQuickViewMode('dayChg')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    quickViewMode === 'dayChg'
                      ? theme === 'dark'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-600 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Day Change
                </button>
              </div>

              {/* Sort Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSortQuick('instrument')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Code {getSortIconQuick('instrument')}
                </button>
                <button
                  onClick={() => handleSortQuick(quickViewMode)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {quickViewMode === 'netChg' ? 'Net Chg' : 'Day Chg'} {getSortIconQuick(quickViewMode)}
                </button>
                <button
                  onClick={() => handleSortQuick('invested')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Invested {getSortIconQuick('invested')}
                </button>
              </div>

              {/* Hide by Tags */}
              <div className="flex items-center gap-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Hide by Tags:
                </label>
                <div className="relative tag-dropdown-container">
                  <button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className={`px-3 py-2 text-sm border rounded-md min-w-[120px] flex items-center justify-between ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">
                      {hiddenQuickViewTags.length === 0
                        ? 'Select tags'
                        : `${hiddenQuickViewTags.length} selected`
                      }
                    </span>
                    <span className={`ml-2 transform transition-transform ${showTagDropdown ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {showTagDropdown && (
                    <div className={`absolute top-full mt-1 border rounded-md shadow-lg z-10 min-w-[200px] max-h-48 overflow-y-auto ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-300'
                    }`}>
                      {allTags.length === 0 ? (
                        <div className={`px-3 py-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          No tags available
                        </div>
                      ) : (
                        <>
                          {allTags.map(tag => (
                            <label
                              key={tag}
                              className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-opacity-80 ${
                                theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={hiddenQuickViewTags.includes(tag)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setHiddenQuickViewTags([...hiddenQuickViewTags, tag]);
                                  } else {
                                    setHiddenQuickViewTags(hiddenQuickViewTags.filter(t => t !== tag));
                                  }
                                }}
                                className="mr-2"
                              />
                              {tag}
                            </label>
                          ))}
                          {hiddenQuickViewTags.length > 0 && (
                            <div className="border-t border-gray-600">
                              <button
                                onClick={() => setHiddenQuickViewTags([])}
                                className={`w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-red-900 hover:bg-opacity-20`}
                              >
                                Clear all
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

              {quickViewLayout === 'minimal' ? (
                <div className="flex flex-wrap gap-2">
                  {sortedHoldingsQuick.map((holding) => (
                    <div
                      key={holding.instrument}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } ${holding.hidden ? 'opacity-50' : ''}`}
                    >
                       <span className="font-medium">{holding.quantity} {holding.instrument}</span>
                      <button
                        onClick={() => toggleHidden(holding.instrument)}
                        className={`px-1 py-0.5 text-xs rounded font-medium transition-colors ${
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
                        {holding.hidden ? 'Inc' : 'Exc'}
                      </button>
                      <span className={`font-semibold ${
                        (quickViewMode === 'netChg' ? holding.netChg : holding.dayChg) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {(quickViewMode === 'netChg' ? holding.netChg : holding.dayChg).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {sortedHoldingsQuick.map((holding) => (
                    <div
                      key={holding.instrument}
                      className={`rounded-lg border p-6 transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } ${holding.hidden ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className={`font-semibold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {holding.instrument}
                        </h3>
                        {holding.hidden && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            Hidden
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${secondaryTextClasses}`}>Quantity</span>
                          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {holding.quantity}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${secondaryTextClasses}`}>Current Value</span>
                          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            ₹{holding.curVal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${secondaryTextClasses}`}>LTP</span>
                          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            ₹{holding.ltp.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${secondaryTextClasses}`}>
                            {quickViewMode === 'netChg' ? 'Net Change' : 'Day Change'}
                          </span>
                          <span className={`font-bold text-xl ${
                            (quickViewMode === 'netChg' ? holding.netChg : holding.dayChg) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {(quickViewMode === 'netChg' ? holding.netChg : holding.dayChg).toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${secondaryTextClasses}`}>P&L</span>
                          <span className={`font-semibold ${holding.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{holding.pl.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Holdings Table - Only show when there's data */}
      {holdings.length > 0 && (isMobile ? (
        // Mobile Card Layout
        <div className="space-y-4">
          {sortedHoldings.map((holding) => (
            <div 
              key={holding.instrument} 
              className={`rounded-lg shadow-md border p-4 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              } ${holding.hidden ? 'opacity-50' : ''} ${selectedInstruments.has(holding.instrument) ? (theme === 'dark' ? 'border-blue-600 bg-blue-900' : 'border-blue-400 bg-blue-50') : ''}`}
            >
              {/* Header with Instrument and Action */}
              <div className="flex justify-between items-start mb-3">
                {bulkSelectionMode && (
                  <div className="flex items-center mr-2">
                    <input
                      type="checkbox"
                      checked={selectedInstruments.has(holding.instrument)}
                      onChange={() => toggleBulkSelection(holding.instrument)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                )}
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

               {/* Averaging Section */}
               <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                   <span className={`text-xs ${secondaryTextClasses}`}>Custom Value</span>
                   <input
                     type="number"
                     step="0.01"
                     value={holding.customValue}
                     onChange={(e) => updateCustomValue(holding.instrument, parseFloat(e.target.value) || 0)}
                     className={`w-full mt-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                       theme === 'dark'
                         ? 'border-gray-600 bg-gray-700 text-white'
                         : 'border-gray-300 bg-white text-gray-900'
                     }`}
                   />
                 </div>
                 <div>
                   <span className={`text-xs ${secondaryTextClasses}`}>Target Avg Cost</span>
                   <input
                     type="number"
                     step="0.01"
                     value={holding.targetAvgCost}
                     onChange={(e) => updateTargetAvgCost(holding.instrument, parseFloat(e.target.value) || 0)}
                     className={`w-full mt-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                       theme === 'dark'
                         ? 'border-gray-600 bg-gray-700 text-white'
                         : 'border-gray-300 bg-white text-gray-900'
                     }`}
                   />
                 </div>
               </div>
                <div className="mb-3">
                  <span className={`text-xs ${secondaryTextClasses}`}>Shares to Buy</span>
                  <p className={`text-sm font-medium ${calculateSharesToBuy(holding) > 0 ? 'text-green-600' : 'text-red-600'}`} title={`Margin needed: ₹${(holding.ltp * calculateSharesToBuy(holding)).toFixed(2)}`}>
                    {calculateSharesToBuy(holding)}
                  </p>
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
                       value={newTagInputs[holding.instrument] || ''}
                       onChange={(e) => setNewTagInputs(prev => ({ ...prev, [holding.instrument]: e.target.value }))}
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
                {bulkSelectionMode && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Select
                  </th>
                )}
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
                  onClick={() => handleSort('instrument')}
                >
                  <div className="flex items-center gap-1">
                    Instrument
                    {getSortIcon('instrument')}
                  </div>
                </th>
                 <th
                   className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 min-w-[80px]"
                   onClick={() => handleSort('quantity')}
                 >
                   <div className="flex items-center gap-1">
                     Qty
                     {getSortIcon('quantity')}
                   </div>
                 </th>
                 <th
                   className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 min-w-[100px]"
                   onClick={() => handleSort('avgCost')}
                 >
                   <div className="flex items-center gap-1">
                     Avg Cost
                     {getSortIcon('avgCost')}
                   </div>
                 </th>
                 <th
                   className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 min-w-[100px]"
                   onClick={() => handleSort('ltp')}
                 >
                   <div className="flex items-center gap-1">
                     LTP
                     {getSortIcon('ltp')}
                   </div>
                 </th>
                 <th
                   className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 min-w-[100px]"
                   onClick={() => handleSort('invested')}
                 >
                   <div className="flex items-center gap-1">
                     Invested
                     {getSortIcon('invested')}
                   </div>
                 </th>
                 <th
                   className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 min-w-[100px]"
                   onClick={() => handleSort('curVal')}
                 >
                   <div className="flex items-center gap-1">
                     Cur Val
                     {getSortIcon('curVal')}
                   </div>
                 </th>
                 <th
                   className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 min-w-[100px]"
                   onClick={() => handleSort('pl')}
                 >
                   <div className="flex items-center gap-1">
                     P&L
                     {getSortIcon('pl')}
                   </div>
                 </th>
                 <th
                   className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 min-w-[100px]"
                   onClick={() => handleSort('netChg')}
                 >
                   <div className="flex items-center gap-1">
                     Net Chg %
                     {getSortIcon('netChg')}
                   </div>
                 </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 min-w-[100px]"
                    onClick={() => handleSort('dayChg')}
                  >
                    <div className="flex items-center gap-1">
                      Day Chg %
                      {getSortIcon('dayChg')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">Custom Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">Target Avg Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">Shares to Buy</th>
                 <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[250px]">Tags</th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding) => (
                <tr key={holding.instrument} className={`${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-50'
                } ${holding.hidden ? 'opacity-50' : ''} ${
                  theme === 'dark' 
                    ? 'bg-gray-800' 
                    : 'bg-white'
                } ${selectedInstruments.has(holding.instrument) ? (theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50') : ''}`}>
                   {bulkSelectionMode && (
                     <td className="px-4 py-4 whitespace-nowrap text-sm">
                       <input
                         type="checkbox"
                         checked={selectedInstruments.has(holding.instrument)}
                         onChange={() => toggleBulkSelection(holding.instrument)}
                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                       />
                     </td>
                   )}
                   <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
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
                  <td className={`px-4 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    {holding.quantity}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    ₹{holding.avgCost.toFixed(2)}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    ₹{holding.ltp.toFixed(2)}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    ₹{holding.invested.toFixed(2)}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                    ₹{holding.curVal.toFixed(2)}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${holding.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{holding.pl.toFixed(2)}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm ${holding.netChg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.netChg.toFixed(2)}%
                  </td>
                   <td className={`px-4 py-4 whitespace-nowrap text-sm ${holding.dayChg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     {holding.dayChg.toFixed(2)}%
                   </td>
                   <td className={`px-4 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                     <input
                       type="number"
                       step="0.01"
                       value={holding.customValue}
                       onChange={(e) => updateCustomValue(holding.instrument, parseFloat(e.target.value) || 0)}
                       className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                         theme === 'dark'
                           ? 'border-gray-600 bg-gray-700 text-white'
                           : 'border-gray-300 bg-white text-gray-900'
                       }`}
                     />
                   </td>
                   <td className={`px-4 py-4 whitespace-nowrap text-sm ${secondaryTextClasses}`}>
                     <input
                       type="number"
                       step="0.01"
                       value={holding.targetAvgCost}
                       onChange={(e) => updateTargetAvgCost(holding.instrument, parseFloat(e.target.value) || 0)}
                       className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                         theme === 'dark'
                           ? 'border-gray-600 bg-gray-700 text-white'
                           : 'border-gray-300 bg-white text-gray-900'
                       }`}
                     />
                   </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${calculateSharesToBuy(holding) > 0 ? 'text-green-600' : 'text-red-600'}`} title={`Margin needed: ₹${(holding.ltp * calculateSharesToBuy(holding)).toFixed(2)}`}>
                      {calculateSharesToBuy(holding)}
                    </td>
                   <td className={`px-4 py-4 text-sm ${secondaryTextClasses} max-w-xs`}>
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
                           value={newTagInputs[holding.instrument] || ''}
                           onChange={(e) => setNewTagInputs(prev => ({ ...prev, [holding.instrument]: e.target.value }))}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                📤 Export Backup JSON
              </h2>
              <button
                onClick={() => setShowExportModal(false)}
                className={`text-2xl hover:opacity-70 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className={`text-sm mb-4 ${secondaryTextClasses}`}>
                Copy this JSON data to backup your holdings, tags, and settings. You can import it later using the Import from JSON option.
              </p>
              <div className="mb-4">
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    copySuccess
                      ? 'bg-green-600 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {copySuccess ? '✓ Copied!' : '📋 Copy to Clipboard'}
                </button>
              </div>
              <div className={`rounded-lg p-4 overflow-auto max-h-96 font-mono text-xs ${
                theme === 'dark' 
                  ? 'bg-gray-900 border border-gray-700 text-gray-300' 
                  : 'bg-gray-50 border border-gray-200 text-gray-800'
              }`}>
                <pre>{exportJson}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                📥 Import Backup JSON
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className={`text-2xl hover:opacity-70 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className={`text-sm mb-4 ${secondaryTextClasses}`}>
                Paste your backup JSON data below. This will replace all current holdings, tags, and settings.
              </p>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste your JSON backup data here..."
                className={`w-full h-64 p-4 rounded-lg font-mono text-xs border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-700 text-gray-300 placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500'
                }`}
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={importDataFromText}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Import Data
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportJson('');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}