/**
 * Data processing and filtering for tax delinquency records.
 */
import { logger } from "../utils/logger.js";
import { validateRecord, validateParcelId, validateAmount, validateAddress } from "../utils/validators.js";
import { parseDate, yearsBetween, isAtLeastYearsAgo } from "../utils/date-utils.js";

export class RecordProcessor {
  constructor(options = {}) {
    this.minDelinquencyYears = options.minDelinquencyYears || 4;
    this.includeSold = options.includeSold || false;
    this.includeExpired = options.includeExpired || true;
    this.maxResults = options.maxResults || 500;
  }

  /**
   * Process a batch of raw records.
   * @param {Array} records
   * @returns {{ valid: Array, invalid: Array, stats: object }}
   */
  process(records) {
    const valid = [];
    const invalid = [];

    for (const record of records) {
      const vr = validateRecord(record);
      if (!vr.valid) {
        invalid.push({ record, errors: vr.errors });
        continue;
      }

      // Filter by delinquency threshold
      if (record.delinquencyYears < this.minDelinquencyYears) {
        logger.debug("Skipping record below threshold", { parcelId: record.parcelId, years: record.delinquencyYears });
        continue;
      }

      // Normalize fields
      const normalized = this._normalize(record);
      valid.push(normalized);
    }

    // Sort by delinquency years descending (most delinquent first)
    valid.sort((a, b) => b.delinquencyYears - a.delinquencyYears);

    // Limit results
    const limited = valid.slice(0, this.maxResults);

    const stats = {
      totalInput: records.length,
      validCount: limited.length,
      invalidCount: invalid.length,
      filteredByThreshold: records.length - limited.length - invalid.length,
      totalDelinquentAmount: limited.reduce((sum, r) => sum + (r.delinquencyAmount || 0), 0),
      avgDelinquencyYears: limited.length ? limited.reduce((s, r) => s + (r.delinquencyYears || 0), 0) / limited.length : 0,
    };

    logger.info("Processing complete", stats);
    return { valid: limited, invalid, stats };
  }

  /** Normalize a single record */
  _normalize(record) {
    return {
      id: record.id || `${record.parcelId}-${record.taxYear || "unknown"}`,
      parcelId: (record.parcelId || "").toUpperCase().trim(),
      ownerName: (record.ownerName || "").trim(),
      address: (record.address || "").trim(),
      delinquencyAmount: typeof record.delinquencyAmount === "number" ? record.delinquencyAmount : parseFloat(String(record.delinquencyAmount).replace(/[^0-9.\-]/g, "")) || 0,
      delinquencyYears: typeof record.delinquencyYears === "number" ? record.delinquencyYears : parseInt(String(record.delinquencyYears), 10) || 0,
      taxYear: record.taxYear || "",
      status: (record.status || "unknown").toLowerCase().trim(),
      source: record.source || "unknown",
      scrapedAt: record.scrapedAt || new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };
  }

  /** Filter records by owner name (case-insensitive partial match) */
  filterByOwner(records, ownerName) {
    const lower = ownerName.toLowerCase();
    return records.filter(r => r.ownerName.toLowerCase().includes(lower));
  }

  /** Filter records by minimum delinquency amount */
  filterByAmount(records, minAmount) {
    return records.filter(r => (r.delinquencyAmount || 0) >= minAmount);
  }

  /** Group records by owner */
  groupByOwner(records) {
    const groups = {};
    for (const r of records) {
      const key = r.ownerName.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }

  /** Group records by year of delinquency */
  groupByDelinquencyYear(records) {
    const groups = {};
    for (const r of records) {
      const key = String(r.delinquencyYears);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }
}

export const processor = new RecordProcessor();