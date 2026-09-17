# Contributing

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/tax-delinquency-scraper.git
cd tax-delinquency-scraper
npm install
cp src/config/.env.example .env
# Edit .env with your values
```

## Development

```bash
npm run dev       # Watch mode
npm test          # Run test suite
npm run scrape    # Run scrapers
npm run process   # Process and filter records
```

## Adding a New County

1. Add the county tax portal URL and selectors to `src/config/sites.js`
2. Test against the live site
3. Add test fixtures in `test/fixtures/`
4. Submit a PR

## Cloudflare Deployment

This project deploys to Cloudflare Pages. See README.md for setup instructions.

## License
MIT