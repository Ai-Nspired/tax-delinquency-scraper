/**
 * Tax lien / delinquency source configurations.
 * San Bernardino County — pre-foreclosure and pre-tax-sale research.
 */
export const SITES = [
  {
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
  },
];

/** Default search parameters */
export const DEFAULT_PARAMS = {
  maxResults: 500,
  includeSold: false,
  includeExpired: true,
  minDelinquencyYears: 4,
};