/**
 * Tax Delinquency Scraper - Main Entry Point
 *
 * San Bernardino County pre-foreclosure and pre-tax-sale research pipeline.
 *
 * Usage:
 *   node src/index.js --search <parcel>   Search a specific parcel
 *   node src/index.js --scrape            Run scrapers
 *   node src/index.js --process          Process raw data
 *   node src/index.js --export           Export results
 *   node src/index.js                    Show status
 */
import { SITES, DEFAULT_PARAMS } from "./config/sites.js";
import { ENV } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { Storage } from "./storage/storage.js";
import { SBCountyTaxScraper } from "./scrapers/sb-county-scraper.js";
import { RecordProcessor } from "./processors/processors.js";
import { validateParcelId } from "./utils/validators.js";

const args = process.argv.slice(2);
const flags = new Set();
const params = {};

for (const arg of args) {
  if (arg.startsWith("--")) {
    const [key, value] = arg.slice(2).split("=");
    flags.add(key);
    if (value !== undefined) params[key] = value;
  }
}

async function main() {
  logger.info("Tax Delinquency Scraper starting", { flags: [...flags], params });

  const storage = new Storage(ENV.OUTPUT_DIR);
  const processor = new RecordProcessor({
    minDelinquencyYears: ENV.MIN_DELINQUENCY_YEARS,
    maxResults: DEFAULT_PARAMS.maxResults,
  });
  const scraper = new SBCountyTaxScraper(SITES[0]);

  // --search <parcelId>
  if (flags.has("search")) {
    const parcelId = params.search || params.parcel;
    if (!parcelId) {
      console.error("Error: --search requires a parcel ID. Usage: --search <parcelId>");
      process.exit(1);
    }
    const validation = validateParcelId(parcelId);
    if (!validation.valid) {
      console.error(`Error: Invalid parcel ID "${parcelId}"`);
      process.exit(1);
    }
    const records = await scraper.searchParcel(parcelId, { minDelinquencyYears: ENV.MIN_DELINQUENCY_YEARS });
    const result = processor.process(records);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // --scrape
  if (flags.has("scrape")) {
    logger.info("Starting scrape of San Bernardino County tax portal");
    const allRecords = [];
    try {
      const records = await scraper.searchParcel(params.parcel || "", { minDelinquencyYears: ENV.MIN_DELINQUENCY_YEARS });
      allRecords.push(...records);
    } catch (err) {
      logger.error(`Scrape error: ${err.message}`);
    }
    const result = processor.process(allRecords);
    storage.saveRecords(result.valid, "records.json");
    console.log(JSON.stringify(result.stats, null, 2));
    return;
  }

  // --process
  if (flags.has("process")) {
    logger.info("Processing stored records");
    const raw = storage.loadRecords();
    const result = processor.process(raw);
    storage.saveRecords(result.valid, "processed.json");
    console.log(JSON.stringify(result.stats, null, 2));
  }

  // Default: show status
  if (flags.size === 0) {
    const stats = storage.getStats();
    console.log("Tax Delinquency Scraper");
    console.log("========================");
    console.log(JSON.stringify(stats, null, 2));
    console.log("\nCommands: --search <parcelId>, --scrape, --process, --export");
  }
}

main().catch(err => {
  logger.error("Fatal error", { error: err.message, stack: err.stack });
  process.exit(1);
});