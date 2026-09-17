// Sample HTML fixture for testing
export const sampleCountyHtml = `
<html><body>
<table id="results-table">
<tbody>
<tr><td class="parcel-id">1234-AB-5678</td><td class="owner-name">John Smith</td><td class="property-address">123 Main St</td><td class="delinquent-amount">$5,432.10</td><td class="delinquency-years">5</td><td class="tax-year">2022</td><td class="compliance-status">delinquent</td></tr>
<tr><td class="parcel-id">9876-CD-9012</td><td class="owner-name">Jane Doe</td><td class="property-address">456 Oak Ave</td><td class="delinquent-amount">$2,100.00</td><td class="delinquency-years">3</td><td class="tax-year">2023</td><td class="compliance-status">current</td></tr>
<tr><td class="parcel-id">5555-EF-3333</td><td class="owner-name">Acme Corp</td><td class="property-address">789 Business Rd</td><td class="delinquent-amount">$12,800.50</td><td class="delinquency-years">7</td><td class="tax-year">2019</td><td class="compliance-status">delinquent</td></tr>
</tbody>
</table>
</body></html>`;

export const sampleRecords = [
  {
    id: "1234-AB-5678-2022",
    parcelId: "1234-AB-5678",
    ownerName: "John Smith",
    address: "123 Main St",
    delinquencyAmount: 5432.10,
    delinquencyYears: 5,
    taxYear: "2022",
    status: "delinquent",
    source: "county-tax-office",
    scrapedAt: "2026-09-16T00:00:00.000Z",
  },
  {
    id: "5555-EF-3333-2019",
    parcelId: "5555-EF-3333",
    ownerName: "Acme Corp",
    address: "789 Business Rd",
    delinquencyAmount: 12800.50,
    delinquencyYears: 7,
    taxYear: "2019",
    status: "delinquent",
    source: "county-tax-office",
    scrapedAt: "2026-09-16T00:00:00.000Z",
  },
];

// Records that should be filtered out (below 4 years)
export const belowThresholdRecords = [
  {
    id: "9876-CD-9012-2023",
    parcelId: "9876-CD-9012",
    ownerName: "Jane Doe",
    address: "456 Oak Ave",
    delinquencyAmount: 2100.00,
    delinquencyYears: 3,
    taxYear: "2023",
    status: "current",
    source: "county-tax-office",
    scrapedAt: "2026-09-16T00:00:00.000Z",
  },
];