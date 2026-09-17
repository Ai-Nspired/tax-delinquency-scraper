# San Bernardino County Tax Delinquency Scraper

Scrapes property tax delinquency records from San Bernardino County for pre-foreclosure and pre-tax-sale research.

**Primary signal**: Properties 4+ years delinquent are the strongest indicators of imminent tax sale or foreclosure.

## Live Demo

- **Frontend (GitHub Pages)**: [https://dno-luigi.github.io/tax-delinquency-scraper](https://dno-luigi.github.io/tax-delinquency-scraper)
- **API (Cloudflare Pages)**: [https://tax-delinquency-scraper.pages.dev](https://tax-delinquency-scraper.pages.dev)

## Project Structure

```
tax-delinquency-scraper/
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD: GitHub Pages + Cloudflare
├── public/                    # GitHub Pages frontend source
│   ├── .nojekyll              # Prevent Jekyll processing
│   ├── index.html             # Main SPA
│   ├── styles.css             # Dark theme styles
│   └── app.js                 # Frontend logic
├── src/
│   ├── index.js               # CLI entry point
│   ├── worker.js              # Cloudflare Worker API
│   ├── config/
│   │   ├── sites.js           # Site configurations & selectors
│   │   ├── env.js             # Environment variable defaults
│   │   └── .env.example       # Example environment file
│   ├── scrapers/
│   │   ├── base-scraper.js    # Base scraper with retry logic
│   │   └── county-scraper.js  # San Bernardino County scraper
│   ├── processors/
│   │   └── processors.js      # Record filtering & normalization
│   ├── storage/
│   │   └── storage.js         # File-based JSON storage
│   └── utils/
│       ├── logger.js          # Logging utility
│       ├── date-utils.js      # Date parsing & calculations
│       └── validators.js      # Input validation
├── test/
│   ├── fixtures/
│   │   └── sample-data.js     # Test fixtures
│   └── scraper.test.js        # Test suite
├── data/
│   ├── raw/                    # Raw HTML/responses
│   └── output/                 # Processed JSON records
├── wrangler.toml               # Cloudflare Worker config
├── _headers                    # Security headers for Pages
├── package.json
└── README.md
```

## Commands

```bash
npm start           # Show status and stored record counts
npm run scrape      # Run scrapers against configured sites
npm run process     # Process raw data and filter 4+ year delinquency
npm run export      # Export processed results
npm run dev         # Run with auto-reload (Node --watch)
npm test            # Run test suite
npm run preview     # Preview frontend locally (npx serve public)
npm run deploy      # Deploy Worker to Cloudflare Pages
npm run gh-pages    # Deploy frontend to GitHub Pages
node src/index.js --search <parcelId>   # Search a specific parcel
```

## GitHub Pages Setup (Frontend)

The frontend is a static SPA served from the `public/` folder.

### Option 1: Automatic via GitHub Actions

The `.github/workflows/deploy.yml` automatically deploys the `public/` folder to GitHub Pages on every push to `main`.

1. Go to **Settings > Pages** on the GitHub repo
2. Set **Source** to `GitHub Actions`
3. The workflow will deploy `public/` automatically

### Option 2: Manual (Deploy from branch)

1. Go to **Settings > Pages**
2. Set **Source** to `Deploy from a branch`
3. Set **Branch** to `main` and **Folder** to `/public`
4. Save

### Frontend URL

Once deployed, the frontend is live at:
```
https://dno-luigi.github.io/tax-delinquency-scraper
```

## Cloudflare Setup (API Backend)

### Prerequisites
1. A [Cloudflare account](https://dash.cloudflare.com/)
2. A domain (or use the free `*.pages.dev` subdomain)
3. A Cloudflare API token with `Account:Edit` and `Pages:Edit` permissions

### Quick Deploy

```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Create KV namespace and R2 bucket
wrangler kv:namespace create RESULTS_KV
wrangler r2 bucket create tax-scraper-raw

# 4. Deploy Worker to Cloudflare Pages
wrangler pages deploy . --project-name tax-delinquency-scraper

# 5. Or connect GitHub for auto-deploy
wrangler pages project create tax-delinquency-scraper --production-branch main
```

### GitHub Secrets Required (for Cloudflare auto-deploy)

| Secret | Description |
|---|---|
| `CF_API_TOKEN` | Cloudflare API token with Pages edit scope |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID |

## API Endpoints

The Cloudflare Worker serves these endpoints:

| Endpoint | Description |
|---|---|
| `GET /api/delinquent?minYears=4` | List all properties 4+ years delinquent |
| `GET /api/search?parcel=1234-AB-5678` | Search by parcel ID |
| `GET /api/stats` | Summary statistics |

## Delinquency Filtering

Records are filtered to include only properties with **4 or more years** of delinquency. This threshold captures properties most likely to be in the pre-foreclosure or pre-tax-sale pipeline. Results are sorted by delinquency years (most delinquent first).

## Pre-Foreclosure / Pre-Tax-Sale Signal

- **4+ years delinquent**: Property is likely past the redemption period and approaching tax sale
- **7+ years delinquent**: Critical — likely already in tax sale or foreclosure pipeline
- **Delinquency amount**: Higher amounts indicate longer neglect or higher assessed values
- **Owner name + address**: Enables direct outreach or list building for investors

## Adding New Counties

Add a new site configuration to `src/config/sites.js` with the county tax portal URL, search path, and CSS selectors.

## License
MIT