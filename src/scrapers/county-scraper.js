/**
 * County tax office scraper.
 * Scrapes property tax delinquency records from county tax office websites.
 */
import { BaseScraper } from "./base-scraper.js";
import { logger } from "../utils/logger.js";
import { validateParcelId, validateRecord } from "../utils/validators.js";

export class CountyTaxScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.selectors = config.selectors || {};
  }

  /**
   * Search for a parcel and return delinquency records.
   * @param {string} parcelId
   * @param {object} [options]
   * @returns {Promise<Array>}
   */
  async searchParcel(parcelId, options = {}) {
    const validation = validateParcelId(parcelId);
    if (!validation.valid) {
      throw new Error(`Invalid parcel ID: ${parcelId}`);
    }

    const searchUrl = this.buildUrl(this.config.searchPath) + "?parcel=" + encodeURIComponent(validation.normalized);
    logger.info(`Searching parcel ${validation.normalized} at ${searchUrl}`);

    const html = await this.fetch(searchUrl);
    const records = this.extractRecords(html);

    // Filter to 4+ years delinquency by default
    const minYears = options.minDelinquencyYears || 4;
    const filtered = records.filter(r => r.delinquencyYears >= minYears);

    logger.info(`Found ${filtered.length} records for parcel ${validation.normalized}`);
    return filtered;
  }

  /**
   * Extract records from HTML using configured selectors.
   * @param {string} html
   * @returns {Array}
   */
  extractRecords(html) {
    const records = [];
    const tableRows = this._extractTableRows(html);
    for (const row of tableRows) {
      const record = this._parseRow(row);
      if (record && record.parcelId) {
        const vr = validateRecord(record);
        if (vr.valid) {
          records.push(record);
        } else {
          logger.warn("Skipping invalid record", { errors: vr.errors, parcelId: record.parcelId });
        }
      }
    }
    return records;
  }

  /** Extract table rows from HTML */
  _extractTableRows(html) {
    const rows = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = trRegex.exec(html)) !== null) {
      rows.push(match[1]);
    }
    return rows;
  }

  /** Parse a table row into a record object */
  _parseRow(rowHtml) {
    const getText = (html) => {
      return html.replace(/<[^>]*>/g, "").trim();
    };

    // Extract all td cells from the row
    const tdMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    const cells = tdMatches.map(td => getText(td));

    // Map cells to fields by position (assumes standard column order)
    const record = {
      id: "",
      parcelId: cells[0] || "",
      ownerName: cells[1] || "",
      address: cells[2] || "",
      delinquencyAmount: this._parseAmount(cells[3]),
      delinquencyYears: this._parseInt(cells[4]),
      taxYear: cells[5] || "",
      status: (cells[6] || "unknown").toLowerCase(),
      source: this.config.id,
      scrapedAt: new Date().toISOString(),
    };

    record.id = record.parcelId + "-" + (record.taxYear || "unknown");
    return record;
  }

  /** Parse a monetary amount from text */
  _parseAmount(text) {
    if (!text) return 0;
    const cleaned = text.replace(/[^0-9.\-]/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  }

  /** Parse an integer from text */
  _parseInt(text) {
    if (!text) return 0;
    const val = parseInt(text.replace(/[^0-9\-]/g, ""), 10);
    return isNaN(val) ? 0 : val;
  }
}

export const countyScraper = new CountyTaxScraper({
  id: "san-bernardino-county-tax",
  name: "San Bernardino County Tax",
  baseUrl: "https://www.sbcountytax.com",
  searchPath: "/search/parcel",
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