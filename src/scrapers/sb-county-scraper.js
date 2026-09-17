/**
 * San Bernardino County Tax Scraper
 * Uses browser automation to search the county tax portal
 * for pre-foreclosure and pre-tax-sale property data.
 */
import { BaseScraper } from "./base-scraper.js";
import { logger } from "../utils/logger.js";
import { validateParcelId, validateRecord } from "../utils/validators.js";

export class SBCountyTaxScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.selectors = config.selectors || {};
  }

  /**
   * Search for a property by parcel ID on the San Bernardino County tax portal.
   * Uses the GSG (Grant Street Group) platform embedded in the county site.
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

    // The county tax portal uses GSG (Grant Street Group) platform
    // The search URL format for GSG:
    const searchUrl = this.buildUrl(this.config.searchPath) + "?parcel=" + encodeURIComponent(validation.normalized);
    logger.info(`Searching at ${searchUrl}`);

    try {
      const html = await this.fetch(searchUrl);
      const records = this.extractRecords(html);

      // Filter to 4+ years delinquency by default
      const minYears = options.minDelinquencyYears || 4;
      const filtered = records.filter(r => r.delinquencyYears >= minYears);

      logger.info(`Found ${filtered.length} records for parcel ${validation.normalized}`);
      return filtered;
    } catch (err) {
      logger.error(`Error searching parcel ${validation.normalized}: ${err.message}`);
      // Return empty array on error - the GSG platform may be down
      return [];
    }
  }

  /**
   * Extract records from HTML response.
   * The GSG platform returns search results in a structured HTML format.
   * @param {string} html
   * @returns {Array}
   */
  extractRecords(html) {
    const records = [];

    // Try to find property rows in the HTML
    // GSG typically renders results in a table or list format
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = trRegex.exec(html)) !== null) {
      const rowHtml = match[1];
      const cells = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      const cellTexts = cells.map(td => td.replace(/<[^>]*>/g, "").trim()).filter(t => t.length > 0);

      if (cellTexts.length >= 4) {
        const record = {
          id: cellTexts[0] + "-" + (cellTexts[cellTexts.length - 1] || "unknown"),
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
        records.push(record);
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
}

export const sbCountyScraper = new SBCountyTaxScraper({
  id: "sb-county-tax",
  name: "San Bernardino County Tax",
  baseUrl: "https://www.sbcountyatc.gov",
  searchPath: "/tax-services/property-tax",
  delinquencyYears: 4,
  selectors: {
    searchForm: "#parcel-search-form",
    accountNumber: "#account-number",
    searchButton: "#search-btn",
    resultsTable: "#results-table tbody tr",
    parcelId: ".parcel-id",
    ownerName: ".owner-name",
    address: ".property-address",
    delinquencyAmount: ".delinquent-amount",
    delinquencyYears: ".delinquency-years",
    taxYear: ".tax-year",
    status: ".compliance-status",
  },
});