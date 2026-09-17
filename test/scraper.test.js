/**
 * Tests for tax delinquency scraper.
 */
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { validateParcelId, validateAmount, validateAddress, validateRecord } from "../src/utils/validators.js";
import { parseDate, yearsBetween, isAtLeastYearsAgo, formatDate } from "../src/utils/date-utils.js";
import { RecordProcessor } from "../src/processors/processors.js";
import { Storage } from "../src/storage/storage.js";
import { sampleRecords, belowThresholdRecords } from "./fixtures/sample-data.js";

// -- Validators --

describe("validateParcelId", () => {
  it("accepts valid alphanumeric parcel IDs", () => {
    const r = validateParcelId("1234-AB-5678");
    assert.equal(r.valid, true);
    assert.equal(r.normalized, "1234-AB-5678");
  });

  it("accepts numeric-only parcel IDs", () => {
    const r = validateParcelId("12345678");
    assert.equal(r.valid, true);
  });

  it("rejects empty or short IDs", () => {
    assert.equal(validateParcelId("").valid, false);
    assert.equal(validateParcelId("ab").valid, false);
  });

  it("normalizes whitespace to dashes", () => {
    const r = validateParcelId("1234 AB 5678");
    assert.equal(r.normalized, "1234-AB-5678");
  });
});

describe("validateAmount", () => {
  it("parses a plain number", () => {
    const r = validateAmount(5432.10);
    assert.equal(r.valid, true);
    assert.equal(r.value, 5432.10);
  });

  it("parses a currency string", () => {
    const r = validateAmount("$5,432.10");
    assert.equal(r.valid, true);
    assert.equal(r.value, 5432.10);
  });

  it("rejects non-numeric input", () => {
    const r = validateAmount("not a number");
    assert.equal(r.valid, false);
  });
});

describe("validateRecord", () => {
  it("accepts a complete record", () => {
    const r = validateRecord(sampleRecords[0]);
    assert.equal(r.valid, true);
  });

  it("rejects a record missing parcelId", () => {
    const r = validateRecord({ ownerName: "Test", address: "123 St" });
    assert.equal(r.valid, false);
    assert.ok(r.errors.includes("Missing parcelId"));
  });
});

// -- Date utils --

describe("parseDate", () => {
  it("parses ISO 8601 dates", () => {
    const d = parseDate("2022-06-15");
    assert.ok(d instanceof Date);
    assert.equal(d.getFullYear(), 2022);
  });

  it("parses MM/DD/YYYY dates", () => {
    const d = parseDate("06/15/2022");
    assert.ok(d instanceof Date);
    assert.equal(d.getMonth(), 5); // 0-indexed
  });

  it("returns null for invalid dates", () => {
    assert.equal(parseDate("not-a-date"), null);
  });
});

describe("yearsBetween", () => {
  it("calculates full years between dates", () => {
    const from = new Date("2019-01-01");
    const to = new Date("2026-01-01");
    assert.equal(yearsBetween(from, to), 7);
  });
});

// -- Processor --

describe("RecordProcessor", () => {
  it("filters records below the 4-year threshold", () => {
    const proc = new RecordProcessor({ minDelinquencyYears: 4 });
    const allRecords = [...sampleRecords, ...belowThresholdRecords];
    const result = proc.process(allRecords);
    assert.equal(result.valid.length, 2); // only the 5-year and 7-year records
    assert.equal(result.invalid.length, 0);
  });

  it("sorts records by delinquency years descending", () => {
    const proc = new RecordProcessor({ minDelinquencyYears: 4 });
    const result = proc.process(sampleRecords);
    assert.equal(result.valid[0].delinquencyYears, 7);
    assert.equal(result.valid[1].delinquencyYears, 5);
  });

  it("calculates total delinquent amount", () => {
    const proc = new RecordProcessor({ minDelinquencyYears: 4 });
    const result = proc.process(sampleRecords);
    assert.equal(result.stats.totalDelinquentAmount, 18232.60);
  });

  it("filters by owner name", () => {
    const proc = new RecordProcessor({ minDelinquencyYears: 4 });
    const result = proc.process(sampleRecords);
    const filtered = proc.filterByOwner(result.valid, "John Smith");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].ownerName, "John Smith");
  });

  it("filters by minimum amount", () => {
    const proc = new RecordProcessor({ minDelinquencyYears: 4 });
    const result = proc.process(sampleRecords);
    const filtered = proc.filterByAmount(result.valid, 10000);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].parcelId, "5555-EF-3333");
  });
});

// -- Storage --

describe("Storage", () => {
  it("saves and loads records", () => {
    const storage = new Storage("./data/test-storage");
    storage.saveRecords(sampleRecords, "test-records.json");
    const loaded = storage.loadRecords("test-records.json");
    assert.equal(loaded.length, 2);
    assert.equal(loaded[0].parcelId, "1234-AB-5678");
  });

  it("returns empty array for missing file", () => {
    const storage = new Storage("./data/test-storage");
    const loaded = storage.loadRecords("nonexistent.json");
    assert.equal(loaded.length, 0);
  });
});