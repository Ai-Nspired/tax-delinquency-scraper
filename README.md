# San Bernardino County Tax Delinquency Scraper

Pragmatic pipeline for scraping, processing, and researching San Bernardino County pre-foreclosure and pre-tax-sale properties.

**Pipeline**: Scrape → Store → Process → Serve

**Scrapes ALL properties with 1-5 years delinquency** regularly (every 6 hours via GitHub Actions).

## Quick Start

```bash
git clone https://github.com/Ai-Nspired/tax-delinquency-scraper.git
cd tax-delinquency-scraper
npm install
npm test
```

## Commands

```bash
npm start           # Show status and stored record counts
node src/index.js --list      # Scrape ALL 1-5yr delinquent properties
node src/index.js --search <parcelId>   # Search a specific parcel
node src/index.js --owner <name>       # Search by owner name
node src/index.js --process   # Process raw data
node src/index.js --watch     # Run scraper on schedule (every 6h)
npm run dev           # Run with auto-reload (Node --watch)
npm test              # Run test suite
```

## Pipeline

### 1. Scrape
The scraper hits the San Bernardino County tax portal and extracts ALL properties with 1-5 years of delinquency.

```bash
node src/index.js --list              # Scrape all 1-5yr delinquent properties
node src/index.js --list --minYears=1 --maxYears=3  # Custom range
node src/index.js --search 1234-AB-5678  # Search specific parcel
node src/index.js --owner "Smith"     # Search by owner name
node src/index.js --watch             # Run on schedule (every 6h)
```

### 2. Process
Filters, sorts, and deduplicates records. Stores cleaned JSON in `data/output/`.

```bash
node src/index.js --process
```

### 3. Serve
The Cloudflare Worker API serves processed data. The GitHub Pages frontend provides a research dashboard.

## Scheduled Scraping

GitHub Actions runs the scraper every 6 hours automatically. Results are stored in `data/output/records.json`.

## Data Fields

| Field | Description |
|---|---|
| `parcelId` | Property parcel identifier |
| `ownerName` | Property owner name |
| `address` | Property address |
| `delinquencyAmount` | Total delinquent tax amount |
| `delinquencyYears` | Years delinquent (1-5 = research range) |
| `taxYear` | Tax year of the delinquency |
| `status` | Current compliance status |

## Delinquency Thresholds

| Years | Meaning |
|---|---|
| 1-3 | Early delinquency — potential payment plans |
| 4-5 | Approaching tax sale — pre-tax-sale opportunity |
| 7+ | Critical — likely in auction pipeline |

## GitHub Pages (Frontend)

The frontend is a static SPA in the `docs/` folder on the `main` branch.

### Enable GitHub Pages

1. Go to **Settings > Pages** on the GitHub repo
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. Set **Branch** to **main** and **Folder** to **/docs**
4. Save — the frontend will be live at `https://Ai-Nspired.github.io/tax-delinquency-scraper`

## Cloudflare (API Backend)

The Cloudflare Worker serves the API at `/api/delinquent`, `/api/search`, and `/api/stats`.

### Setup
```bash
npm install -g wrangler
wrangler login
wrangler kv:namespace create RESULTS_KV
wrangler r2 bucket create tax-scraper-raw
wrangler pages deploy . --project-name tax-delinquency-scraper
```

### GitHub Secrets for Cloudflare auto-deploy

| Secret | Description |
|---|---|
| `CF_API_TOKEN` | Cloudflare API token with Pages edit scope |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID |

## Adding New Counties

Add a new site configuration to `src/config/sites.js` with the county tax portal URL, search path, and CSS selectors.

## License
MIT