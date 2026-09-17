/**
 * Base scraper class with common HTTP fetching and retry logic.
 */
import { logger } from "../utils/logger.js";

export class BaseScraper {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl;
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10);
    this.delay = parseInt(process.env.REQUEST_DELAY_MS || "1000", 10);
    this.maxRetries = parseInt(process.env.MAX_RETRIES || "3", 10);
  }

  /**
   * Fetch a URL with retry logic.
   * @param {string} url
   * @param {object} [options]
   * @returns {Promise<string>} HTML content
   */
  async fetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "TaxScraper/0.1.0 (property research tool)",
            "Accept": "text/html,application/xhtml+xml",
          },
          ...options,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        logger.debug(`Fetched ${url} (attempt ${attempt})`);
        return html;
      } catch (err) {
        clearTimeout(timeoutId);
        logger.warn(`Fetch attempt ${attempt} failed for ${url}: ${err.message}`);
        if (attempt === this.maxRetries) throw err;
        await this._sleep(this.delay * attempt);
      }
    }
  }

  /**
   * Build a full URL from a path.
   * @param {string} path
   * @returns {string}
   */
  buildUrl(path) {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const p = path.startsWith("/") ? path : "/" + path;
    return base + p;
  }

  /**
   * Parse HTML and extract records using CSS selectors.
   * This is a template method — subclasses override extractRecords.
   * @param {string} html
   * @returns {Promise<Array>}
   */
  async scrape(html) {
    throw new Error("scrape() must be implemented by subclass");
  }

  /** Sleep helper */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}