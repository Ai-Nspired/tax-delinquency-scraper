# San Bernardino County Tax Delinquency Scraper

Pragmatic pipeline for scraping, processing, and researching San Bernardino County pre-foreclosure and pre-tax-sale properties.

**Pipeline**: Scrape → Store → Process → Serve

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
npm run scrape      # Run scraper against San Bernardino County
npm run process     # Process raw data and filter 4+ year delinquency
npm run export      # Export processed results
npm run dev         # Run with auto-reload (Node --watch)
npm test            # Run test suite
node src/index.js --search <parcelId>   # Search a specific parcel
```

## Pipeline

### 1. Scrape
The scraper hits the San Bernardino County tax portal (powered by Grant Street Group) and extracts property records.

```bash
node src/index.js --search 1234-AB-5678
```

### 2. Process
Filters records to 4+ years delinquent (pre-tax-sale threshold), sorts by severity, and deduplicates.

```bash
node src/index.js --process
```

### 3. Serve
The Cloudflare Worker API serves processed data. The GitHub Pages frontend provides a research dashboard.

## Data Fields

| Field | Description |
|---|---|
| `parcelId` | Property parcel identifier |
| `ownerName` | Property owner name |
| `address` | Property address |
| `delinquencyAmount` | Total delinquent tax amount |
| `delinquencyYears` | Years delinquent (4+ = pre-tax-sale) |
| `taxYear` | Tax year of the delinquency |
| `status` | Current compliance status |

## Delinquency Threshold

Properties with **4+ years** of delinquency are flagged as pre-tax-sale candidates. Properties with **7+ years** are critical — likely already in the auction pipeline.

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