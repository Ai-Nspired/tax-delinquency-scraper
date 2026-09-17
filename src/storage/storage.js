/**
 * File-based JSON storage for scraped property records.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { logger } from "../utils/logger.js";

export class Storage {
  constructor(baseDir = "./data") {
    this.baseDir = baseDir;
    this.rawDir = join(baseDir, "raw");
    this.outputDir = join(baseDir, "output");
    this._ensureDir(this.rawDir);
    this._ensureDir(this.outputDir);
  }

  _ensureDir(dir) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  /** Save raw HTML/response data */
  saveRaw(filename, content) {
    const path = join(this.rawDir, filename);
    writeFileSync(path, content, "utf-8");
    logger.debug("Saved raw data", { path });
    return path;
  }

  /** Load raw data by filename */
  loadRaw(filename) {
    const path = join(this.rawDir, filename);
    if (!existsSync(path)) return null;
    return readFileSync(path, "utf-8");
  }

  /** Save processed records as JSON */
  saveRecords(records, filename = "records.json") {
    const path = join(this.outputDir, filename);
    const data = JSON.stringify(records, null, 2);
    writeFileSync(path, data, "utf-8");
    logger.info("Saved records", { path, count: records.length });
    return path;
  }

  /** Load records from JSON file */
  loadRecords(filename = "records.json") {
    const path = join(this.outputDir, filename);
    if (!existsSync(path)) return [];
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw);
  }

  /** List all output files */
  listOutputFiles() {
    if (!existsSync(this.outputDir)) return [];
    return readdirSync(this.outputDir);
  }

  /** Append records to an existing JSON file (for incremental updates) */
  appendRecords(newRecords, filename = "records.json") {
    const existing = this.loadRecords(filename);
    const merged = [...existing, ...newRecords];
    // Deduplicate by parcelId + taxYear
    const seen = new Set();
    const deduped = merged.filter(r => {
      const key = r.parcelId + "-" + r.taxYear;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return this.saveRecords(deduped, filename);
  }

  /** Get summary stats */
  getStats() {
    const records = this.loadRecords();
    const total = records.length;
    const totalDelinquent = records.reduce((sum, r) => sum + (r.delinquencyAmount || 0), 0);
    const byYears = {};
    for (const r of records) {
      const y = r.delinquencyYears || 0;
      byYears[y] = (byYears[y] || 0) + 1;
    }
    return { total, totalDelinquent, byYears, oldestRecord: records.length ? records[0].scrapedAt : null };
  }
}

export const storage = new Storage();