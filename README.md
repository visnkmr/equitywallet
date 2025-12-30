# Equity Wallet - Investment Portfolio Tracker

A comprehensive investment portfolio tracker with advanced features for managing holdings, tags, and performance analytics.

## Features

### 📊 **Portfolio Management**
- **CSV/Excel Import**: Upload holdings data from your broker
- **Real-time Calculations**: Automatic P&L, percentages, and day changes
- **Multi-summary Views**: 
  - Main portfolio (visible holdings)
  - Complete portfolio (all holdings including excluded)
  - Excluded holdings summary
  - Tag-based summaries

### 🏷️ **Advanced Tagging System**
- **Bulk Tag Operations**: Tag multiple holdings at once
- **Smart Search**: Filter holdings by name or tags
- **Untagged Filter**: Find and tag untagged holdings
- **Flexible Organization**: Create custom categories and groups

### 📈 **Performance Analytics**
- **5 Key Metrics**:
  - Total Invested
  - Current Value
  - Total P&L
  - P&L Percentage
  - Day's Change (weighted average)
- **Zero-value Filtering**: Excludes delisted/suspended securities
- **Accurate Calculations**: Weighted averages for meaningful insights

### 🔍 **Powerful Filtering**
- **Search**: Filter by instrument name or tags
- **Tag Filtering**: View holdings by specific tags
- **Visibility Toggle**: Include/exclude holdings from calculations
- **Untagged Focus**: Identify holdings needing categorization

### 🎨 **User Experience**
- **Dark/Light Themes**: Choose your preferred theme
- **Responsive Design**: Works on desktop and mobile
- **Collapsible Sections**: Organize information efficiently
- **Export/Import**: Backup and restore portfolio data

## Getting Started

### Prerequisites
- Node.js 18+ 
- bun, npm, or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd equitywallet

# Install dependencies
bun install
# or
npm install
# or
yarn install
```

### Running the Application

```bash
# Development server
bun run dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Building for Production

```bash
# Build optimized version
bun run build
# or
npm run build
# or
yarn build

# Start production server
bun run start
# or
npm run start
```

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Run linter
bun run lint
```

## Usage

### 1. **Import Holdings**
- Click the "Upload CSV/Excel" button
- Select your brokerage export file
- Supported format: Instrument, Qty, Avg Cost, LTP, Invested, Cur Val, P&L, Net Chg %, Day Chg %

### 2. **Organize with Tags**
- Use bulk selection to tag multiple holdings
- Search for specific holdings to tag
- Find untagged holdings with the untagged filter
- Create custom categories like "tech", "growth", "dividend"

### 3. **Analyze Performance**
- View main portfolio summary (excluded items hidden)
- Check complete portfolio summary (includes all holdings)
- Analyze excluded holdings performance separately
- Review tag-based summaries for sector analysis

### 4. **Manage Holdings**
- Toggle holdings inclusion/exclusion in calculations
- Use quick view for compact overview
- Apply search and filters for focused analysis
- Export data for backup or analysis

## Data Format

### Required CSV/Excel Columns
1. **Instrument**: Stock/bond symbol
2. **Qty**: Quantity held
3. **Avg Cost**: Average purchase price
4. **LTP**: Last traded price
5. **Invested**: Total investment amount
6. **Cur Val**: Current market value
7. **P&L**: Profit and loss amount
8. **Net Chg %**: Net change percentage
9. **Day Chg %**: Daily change percentage

### Calculation Logic
- **Zero-value Filtering**: Holdings with current value = 0 are excluded from calculations
- **Weighted Day Change**: Day change weighted by invested amount
- **P&L Percentage**: Total P&L / Total Invested × 100
- **Visible Holdings**: Only non-hidden holdings included in main summary

## Features Deep Dive

### 📋 **All Holdings Section**
Complete portfolio management with:
- Search by instrument name or tags
- "Show Untagged Only" filter
- Bulk selection for tagging
- Complete portfolio metrics

### 🏷️ **Tag-Based Summaries**
Each tag shows:
- Total invested in tag category
- Current value of tag holdings
- P&L for the category
- P&L percentage
- Day's change

### 💾 **Data Management**
- **Export**: JSON backup with all holdings, tags, and settings
- **Import**: Restore portfolio from backup file
- **Clear Data**: Reset application to initial state

## Testing

The application includes comprehensive tests for calculation functions:

```bash
# Run calculation tests
bun test src/__tests__/calculations.test.ts
```

### Test Coverage
- ✅ Total invested calculations
- ✅ Current value computations  
- ✅ P&L percentage accuracy
- ✅ Weighted day change calculations
- ✅ Zero-value filtering
- ✅ Hidden holdings exclusion
- ✅ Edge cases and error handling

## Technology Stack

- **Frontend**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4
- **Type Safety**: TypeScript
- **File Processing**: XLSX for CSV/Excel imports
- **Testing**: Jest with React Testing Library
- **State Management**: React hooks and localStorage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Equity Wallet** - Your intelligent investment portfolio companion 🚀