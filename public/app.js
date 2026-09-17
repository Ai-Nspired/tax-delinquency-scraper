/**
 * Tax Delinquency Scanner — Frontend App
 * Connects to the Cloudflare Worker API for data.
 */

const API_BASE = "/api";
const API_TIMEOUT = 10000;

/** Fetch with timeout */
async function fetchJSON(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
      ...options,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/** Format currency */
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

/** Format date */
function formatDate(isoString) {
  if (!isoString) return "unknown");
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Get severity level for a record */
function getSeverity(record) {
  if (record.delinquencyYears >= 7) return "critical";
  if (record.delinquencyYears >= 5) return "critical";
  if (record.delinquencyYears >= 4) return "warning";
  return "warning";
}

/** Render a single property card */
function renderCard(record) {
  const severity = getSeverity(record);
  const yearsBadge = `<span class="meta-badge years">${record.delinquencyYears}yr${record.delinquencyYears !== 1 ? "s" : ""}</span>`;
  const amountBadge = `<span class="meta-badge amount">${formatCurrency(record.delinquencyAmount)}</span>`;
  const statusBadge = `<span class="meta-badge status-${record.status || "unknown"}">${record.status || "unknown"}</span>`;

  return `
    <div class="property-card ${severity}">
      <div class="property-main">
        <h3>${record.parcelId || "Unknown"}</h3>
        <div class="owner">${record.ownerName || "Unknown Owner"}</div>
        <div class="address">${record.address || "Unknown Address"}</div>
        <div class="property-detail">Tax Year: ${record.taxYear || "N/A"} · Scraped: ${formatDate(record.scrapedAt)}</div>
      </div>
      <div class="property-meta">
        ${yearsBadge}
        ${amountBadge}
        ${statusBadge}
      </div>
    </div>
  `;
}

/** Render all records */
function renderResults(records) {
  const list = document.getElementById("results-list");
  const noResults = document.getElementById("no-results");
  const title = document.getElementById("results-title");

  if (!records || records.length === 0) {
    list.innerHTML = "";
    noResults.classList.remove("hidden");
    title.textContent = "No Properties Found";
    return;
  }

  noResults.classList.add("hidden");
  title.textContent = `Properties (${records.length})`);
  list.innerHTML = records.map(renderCard).join("");
}

/** Update stats display */
function updateStats(stats) {
  document.getElementById("stat-total").textContent = stats.total || 0;
  document.getElementById("stat-delinquent").textContent = formatCurrency(stats.totalDelinquent || 0);
  document.getElementById("stat-years").textContent = stats.avgDelinquencyYears ? stats.avgDelinquencyYears.toFixed(1) : "—";
}

/** Show/hide loading state */
function setLoading(loading) {
  const el = document.getElementById("loading");
  if (loading) el.classList.remove("hidden"); else el.classList.add("hidden");
}

/** Show error message */
function showError(message) {
  const el = document.getElementById("error");
  el.textContent = "Error: " + message;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 5000);
}

/** Search for a specific parcel */
async function searchParcel() {
  const input = document.getElementById("parcel-search");
  const parcelId = input.value.trim();
  if (!parcelId) return;

  setLoading(true);
  try {
    const data = await fetchJSON(`${API_BASE}/search?parcel=${encodeURIComponent(parcelId)}`);
    if (data.error) {
      showError(data.error);
      renderResults([]);
    } else {
      renderResults(Array.isArray(data) ? data : [data]);
    }
  } catch (err) {
    showError(err.message);
    renderResults([]);
  } finally {
    setLoading(false);
  }
}

/** Load all delinquent properties */
async function loadAllProperties() {
  setLoading(true);
  try {
    const data = await fetchJSON(`${API_BASE}/delinquent?minYears=4`);
    const records = Array.isArray(data) ? data : (data.records || []);
    renderResults(records);
    updateStats(data.stats || { total: records.length, totalDelinquent: 0, avgDelinquencyYears: 0 });
  } catch (err) {
    showError("Failed to load properties. The API may not be deployed yet.");
    renderResults([]);
  } finally {
    setLoading(false);
  }
}

/** Sort results by selected criteria */
function sortResults() {
  const select = document.getElementById("sort-select");
  const value = select.value;
  const list = document.getElementById("results-list");
  const cards = Array.from(list.children);

  cards.sort((a, b) => {
    const aYears = parseInt(a.querySelector(".meta-badge.years")?.textContent || "0");
    const bYears = parseInt(b.querySelector(".meta-badge.years")?.textContent || "0");
    const aAmount = parseFloat(a.querySelector(".meta-badge.amount")?.textContent.replace(/[^0-9.\-]/g, "") || "0");
    const bAmount = parseFloat(b.querySelector(".meta-badge.amount")?.textContent.replace(/[^0-9.\-]/g, "") || "0");

    switch (value) {
      case "years-desc": return bYears - aYears;
      case "years-asc": return aYears - bYears;
      case "amount-desc": return bAmount - aAmount;
      case "amount-asc": return aAmount - bAmount;
      default: return 0;
    }
  });

  cards.forEach(card => list.appendChild(card));
}

/** Handle Enter key on search input */
document.getElementById("parcel-search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchParcel();
});

/** Load all properties on page load */
document.addEventListener("DOMContentLoaded", loadAllProperties);