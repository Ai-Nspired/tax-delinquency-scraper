/**
 * State tax portal scraper.
 * Scrapes property tax delinquency records from state-level tax portals.
 */
import { BaseScraper } from "./base-scraper.js";
import { logger } from "../utils/logger.js";
import { validateParcelId, validateRecord } from "../utils/validators.js";

export class StateTaxScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.selectors = config.selectors || {};
  }

  /**
   * Search for properties by parcel ID.
   * @param {string} parcelId
   * @returns {Promise<Array>}
   */
  async searchByParcel(parcelId) {
    const validation = validateParcelId(parcelId);
    if (!validation.valid) {
      throw new Error(`Invalid parcel ID: ${parcelId}`);
    }

    const url = this.buildUrl(this.config.searchPath) + "?parcel=" + encodeURIComponent(validation.normalized);
    logger.info(`Searching parcel ${validation.normalized} at ${url}`);

    const html = await this.fetch(url);
    const records = this._extractFromHtml(html);

    // Filter to 4+ years delinquency
    const minYears = this.config.delinquincyYears || 4;
    return records.filter(r => r.delinquencyYears >= minYears);
  }

  /** Extract records from HTML table rows */
  _extractFromHtml(html) {
    const records = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = trRegex.exec(html)) !== null) {
      const rowHtml = match[1];
      const tdMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      const cells = tdMatches.map(td => td.replace(/<[^>]*>/g, "").trim());

      if (cells.length < 3) continue; // skip rows with too few cells

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
      records.push(record);
    }
    return records;
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

export const stateScraper = new StateTaxScraper({
  id: "state-tax-portal",
  name: "State Tax Portal",
  baseUrl: "https://taxportal.example.state.gov",
  searchPath: "/property-search",
  delinquencyYears: 4,
  selectors: {
    searchForm: "form.search-form",
    accountNumber: "input[name=parcel_id]",
    searchButton: "button[type=submit]",
    resultsTable: ".search-results .record-row",
    parcelId: ".parcel-id",
    ownerName: ".owner",
    address: ".address",
    delinquencyAmount: ".amount-due",
    delinquencyYears: ".years-delinquent",
    taxYear: ".tax-year",
    status: ".status-badge",
  },
});