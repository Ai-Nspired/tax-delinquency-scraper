/**
 * Environment configuration for the tax delinquency scraper.
 * Copy .env.example to .env and fill in values.
 */
export const ENV = {
  // Output directory for scraped data
  OUTPUT_DIR: process.env.SCRAPER_OUTPUT_DIR || './data/output',
  RAW_DIR: process.env.SCRAPER_RAW_DIR || './data/raw',

  // Request settings
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
  REQUEST_DELAY_MS: parseInt(process.env.REQUEST_DELAY_MS || '1000', 10),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),

  // Delinquency threshold (years)
  MIN_DELINQUENCY_YEARS: parseInt(process.env.MIN_DELINQUENCY_YEARS || '4', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Storage
  STORAGE_FORMAT: process.env.STORAGE_FORMAT || 'json',
  COMPRESS_OUTPUT: process.env.COMPRESS_OUTPUT === 'true',
};
