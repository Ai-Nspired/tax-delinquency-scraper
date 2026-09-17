# San Bernardino County Tax Delinquency Scraper

Scrapes property tax delinquency records from San Bernardino County for pre-foreclosure and pre-tax-sale research.

**Primary signal**: Properties 4+ years delinquent are the strongest indicators of imminent tax sale or foreclosure.

## Live Demo

Deployed on Cloudflare Pages: [tax-delinquency-scraper.pages.dev](https://tax-delinquency-scraper.pages.dev)

## Project Structure

```
tax-delinquency-scraper/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Cloudflare Pages CI/CD
├── src/
│   ├── index.js              # CLI entry point
│   ├── config/
│   │   ├── sites.js          # Site configurations & selectors
│   │   ├── env.js            # Environment variable defaults
│   │   └── .env.example      # Example environment file
│   ├── scrapers/
│   │   ├── base-scraper.js   # Base scraper with retry logic
│   │   └── county-scraper.js # San Bernardino County scraper
│   ├── processors/
│   │   └── processors.js     # Record filtering & normalization
│   ├── storage/
│   │   └── storage.js        # File-based JSON storage
│   └── utils/
│       ├── logger.js         # Logging utility
│       ├── date-utils.js     # Date parsing & calculations
│       └── validators.js     # Input validation
├── test/
│   ├── fixtures/
│   │   └── sample-data.js    # Test fixtures
│   └── scraper.test.js       # Test suite
├── data/
│   ├── raw/                  # Raw HTML/responses
│   └── output/               # Processed JSON records
├── wrangler.toml             # Cloudflare Pages config
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
node src/index.js --search <parcelId>   # Search a specific parcel
```

## Cloudflare Setup

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

# 3. Deploy to Cloudflare Pages
wrangler pages deploy . --project-name tax-delinquency-scraper

# 4. Or connect GitHub for auto-deploy
wrangler pages project create tax-delinquency-scraper --production-branch main
```

### GitHub Integration

1. Create a new GitHub repository
2. Push this project to the repo
3. In Cloudflare Dashboard → Pages → Create Project → Connect to Git
4. Select the repo and configure:
   - Build command: `npm ci && npm test`
   - Build output directory: `.`
5. Add secrets: `CF_API_TOKEN` and `CF_ACCOUNT_ID`
6. Deploy on every push to `main`

### GitHub Secrets Required

| Secret | Description |
|---|---|
| `CF_API_TOKEN` | Cloudflare API token with Pages edit scope |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID |

## Delinquency Filtering

Records are filtered to include only properties with **4 or more years** of delinquency. This threshold captures properties most likely to be in the pre-foreclosure or pre-tax-sale pipeline. Results are sorted by delinquency years (most delinquent first).

## Pre-Foreclosure / Pre-Tax-Sale Signal

- **4+ years delinquent**: Property is likely past the redemption period and approaching tax sale
- **Delinquency amount**: Higher amounts indicate longer neglect or higher assessed values
- **Owner name + address**: Enables direct outreach or list building for investors

## Adding New Counties

Add a new site configuration to `src/config/sites.js` with the county tax portal URL, search path, and CSS selectors.

## License
MIT