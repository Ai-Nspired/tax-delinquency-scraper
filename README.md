# San Bernardino County Tax Delinquency Scraper

Scrapes property tax delinquency records from San Bernardino County for pre-foreclosure and pre-tax-sale research.

**Primary signal**: Properties 4+ years delinquent are the strongest indicators of imminent tax sale or foreclosure.

## Live Demo

- **Frontend (GitHub Pages)**: [https://Ai-Nspired.github.io/tax-delinquency-scraper](https://Ai-Nspired.github.io/tax-delinquency-scraper)
- **API (Cloudflare Pages)**: [https://tax-delinquency-scraper.pages.dev](https://tax-delinquency-scraper.pages.dev)

## Quick Start

```bash
git clone https://github.com/Ai-Nspired/tax-delinquency-scraper.git
cd tax-delinquency-scraper
npm install
npm test
npm start
```

## Commands

```bash
npm start           # Show status and stored record counts
npm run scrape      # Run scrapers against configured sites
npm run process     # Process raw data and filter 4+ year delinquency
npm run export      # Export processed results
npm run dev         # Run with auto-reload (Node --watch)
npm test            # Run test suite
npm run preview     # Preview frontend locally (npx serve docs)
npm run deploy      # Deploy Worker to Cloudflare Pages
node src/index.js --search <parcelId>   # Search a specific parcel
```

## GitHub Pages (Frontend)

The frontend is a static SPA in the `docs/` folder. GitHub Pages serves this folder automatically.

### Enable GitHub Pages

1. Go to **Settings > Pages** on the GitHub repo
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. The `.github/workflows/deploy.yml` workflow will automatically deploy the `docs/` folder on every push to `main`
4. Once deployed, the frontend is live at `https://<your-username>.github.io/tax-delinquency-scraper`

### What gets deployed

| File | Purpose |
|---|---|
| `docs/index.html` | Main SPA with search bar, stats, and property list |
| `docs/styles.css` | Dark theme, responsive styles |
| `docs/app.js` | Frontend logic — fetches from `/api/*` endpoints |
| `docs/.nojekyll` | Prevents Jekyll processing of assets |

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

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/delinquent?minYears=4` | List all properties 4+ years delinquent |
| `GET /api/search?parcel=1234-AB-5678` | Search by parcel ID |
| `GET /api/stats` | Summary statistics |

## Pre-Foreclosure / Pre-Tax-Sale Signal

- **4+ years delinquent**: Property is likely past the redemption period and approaching tax sale
- **7+ years delinquent**: Critical — likely already in tax sale or foreclosure pipeline
- **Delinquency amount**: Higher amounts indicate longer neglect or higher assessed values
- **Owner name + address**: Enables direct outreach or list building for investors

## Adding New Counties

Add a new site configuration to `src/config/sites.js` with the county tax portal URL, search path, and CSS selectors.

## License
MIT