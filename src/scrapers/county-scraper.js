/**
 * San Bernardino County Tax Scraper
 * Pragmatic browser-based scraper for pre-foreclosure/pre-tax-sale research.
 * Interacts with the county tax portal to extract property delinquency data.
 */
import { BaseScraper } from "./base-scraper.js";
import { logger } from "../utils/logger.js";
import { validateParcelId, validateRecord } from "../utils/validators.js";

export class SBCountyTaxScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.minDelinquencyYears = config.minDelinquencyYears || 1;
    this.maxDelinquencyYears = config.maxDelinquencyYears || 5;
    this.baseUrl = config.baseUrl || "https://www.sbcountyatc.gov";
    this.searchPath = config.searchPath || "/tax-services/property-tax";
  }

  /**
   * List ALL properties with 1-5 years delinquency.
   * This is the primary research method for pre-foreclosure/pre-tax-sale analysis.
   * Uses the county tax portal to search and extract property records.
   * @param {object} [options]
   * @returns {Promise<Array>}
   */
  async listAllDelinquent(options = {}) {
    const minYears = options.minDelinquencyYears || this.minDelinquencyYears;
    const maxYears = options.maxDelinquencyYears || this.maxDelinquencyYears;
    const batchSize = options.batchSize || 100;
    const maxResults = options.maxResults || 5000;

    logger.info(`Listing all properties with ${minYears}-${maxYears} years delinquency`);
    logger.info(`Target: San Bernardino County Tax Portal (GSG platform)`);

    // The county tax portal uses GSG (Grant Street Group) platform
    // The search is done through the embedded iframe at:
    // https://gsgprod.sbcountyatc.gov/ca-sanbernardino/ca-sanbernardino/property-tax
    //
    // For bulk scraping, the GSG platform supports pagination via URL parameters.
    // The search form accepts parcel ID, owner name, and address queries.

    const allRecords = [];
    let offset = 0;

    while (allRecords.length < maxResults) {
      try {
        const url = this.buildUrl(this.searchPath) + "?delinquent=true&minYears=" + minYears + "&maxYears=" + maxYears + "&offset=" + offset + "&limit=" + batchSize;
        logger.info(`Fetching batch: offset=${offset}, limit=${batchSize}`);

        const html = await this.fetch(url);
        const records = this.extractRecords(html);

        if (records.length === 0) {
          logger.info("No more records found, stopping pagination");
          break;
        }

        allRecords.push(...records);
        offset += batchSize;

        // Respect rate limits
        await this._sleep(this.delay || 1000);
      } catch (err) {
        logger.error(`Error fetching batch at offset ${offset}: ${err.message}`);
        break;
      }
    }

    // Filter to the target delinquency range
    const filtered = allRecords.filter(r => r.delinquencyYears >= minYears && r.delinquencyYears <= maxYears);

    // Sort by delinquency years descending (most delinquent first)
    filtered.sort((a, b) => b.delinquencyYears - a.delinquencyYears);

    logger.info(`Found ${filtered.length} properties with ${minYears}-${maxYears} years delinquency`);
    return filtered;
  }

  /**
   * Search for a specific parcel by ID.
   * @param {string} parcelId
   * @param {object} [options]
   * @returns {Promise<Array>}
   */
  async searchParcel(parcelId, options = {}) {
    const validation = validateParcelId(parcelId);
    if (!validation.valid) {
      throw new Error(`Invalid parcel ID: ${parcelId}`);
    }

    logger.info(`Searching San Bernardino County for parcel ${validation.normalized}`);
    const searchUrl = this.buildUrl(this.searchPath) + "?parcel=" + encodeURIComponent(validation.normalized);

    try {
      const html = await this.fetch(searchUrl);
      const records = this.extractRecords(html);
      const minYears = options.minDelinquencyYears || this.minDelinquencyYears;
      const filtered = records.filter(r => r.delinquencyYears >= minYears);
      logger.info(`Found ${filtered.length} records for parcel ${validation.normalized}`);
      return filtered;
    } catch (err) {
      logger.error(`Error searching parcel ${validation.normalized}: ${err.message}`);
      return [];
    }
  }

  /**
   * Search by owner name (partial match).
   * @param {string} ownerName
   * @param {object} [options]
   * @returns {Promise<Array>}
   */
  async searchByOwner(ownerName, options = {}) {
    logger.info(`Searching San Bernardino County for owner "${ownerName}"`);
    const searchUrl = this.buildUrl(this.searchPath) + "?owner=" + encodeURIComponent(ownerName.trim());

    try {
      const html = await this.fetch(searchUrl);
      const records = this.extractRecords(html);
      const minYears = options.minDelinquencyYears || this.minDelinquencyYears;
      const filtered = records.filter(r => r.delinquencyYears >= minYears);
      logger.info(`Found ${filtered.length} records for owner "${ownerName}"`);
      return filtered;
    } catch (err) {
      logger.error(`Error searching owner "${ownerName}": ${err.message}`);
      return [];
    }
  }

  /**
   * Extract records from HTML response.
   * @param {string} html
   * @returns {Array}
   */
  extractRecords(html) {
    const records = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;

    while ((match = trRegex.exec(html)) !== null) {
      const rowHtml = match[1];
      const tdMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      const cellTexts = tdMatches.map(td => td.replace(/<[^>]*>/g, "").trim()).filter(t => t.length > 0);

      if (cellTexts.length >= 4) {
        const record = {
          id: "",
          parcelId: cellTexts[0] || "",
          ownerName: cellTexts[1] || "",
          address: cellTexts[2] || "",
          delinquencyAmount: this._parseAmount(cellTexts[cellTexts.length - 2] || "0"),
          delinquencyYears: this._parseInt(cellTexts[cellTexts.length - 3] || "0"),
          taxYear: cellTexts[cellTexts.length - 1] || "",
          status: "delinquent",
          source: this.config.id,
          scrapedAt: new Date().toISOString(),
        };
        record.id = record.parcelId + "-" + (record.taxYear || "unknown");
        const vr = validateRecord(record);
        if (vr.valid) records.push(record);
      }
    }

    return records;
  }

  _parseAmount(text) {
    if (!text) return 0;
    const cleaned = text.replace(/[^0-9.\-]/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  }

  _parseInt(text) {
    if (!text) return 0;
    const val = parseInt(text.replace(/[^0-9\-]/g, ""), 10);
    return isNaN(val) ? 0 : val;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const sbCountyScraper = new SBCountyTaxScraper({
  id: "sb-county-tax",
  name: "San Bernardino County Tax",
  baseUrl: "https://www.sbcountyatc.gov",
  searchPath: "/tax-services/property-tax",
  minDelinquencyYears: 1,
  maxDelinquencyYears: 5,
});