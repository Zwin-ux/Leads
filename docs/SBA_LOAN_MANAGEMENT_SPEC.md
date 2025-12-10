# SBA 504 Loan Management System - Specification

## Overview

This specification outlines the integration of a full SBA 504 loan lifecycle management system into the existing Leads application. The system will track loans from initial lead through funding, servicing, and final disposition.

---

## Data Model

### 1. Lead/Project Core (Existing + Enhanced)

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `id` | string (UUID) | Unique identifier | Auto-generated |
| `status` | enum | Current pipeline stage | Dropdown |
| `bdo` | string | Business Development Officer | User lookup |
| `lp` | string | Loan Processor | User lookup |
| `assignedDate` | date | LP Assignment Date | Auto on assignment |
| `dateReceived` | date | Date lead received | Auto on creation |
| `projectId` | string | Internal Project ID | Auto-generated |

### 2. Borrower Information

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `borrowerName` | string | Primary borrower name | Required |
| `dba` | string | Doing Business As | Optional |
| `operatingCompany` | string | Operating company name | Required for 504 |
| `epc` | string | Eligible Passive Company | For multi-entity deals |

### 3. Project/Property Details

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `apn` | string | Assessor's Parcel Number | Format: XXX-XXX-XXX |
| `streetNumber` | string | Project street number | Required |
| `streetName` | string | Project street name | Required |
| `suiteNumber` | string | Suite/Unit number | Optional |
| `city` | string | City | Required |
| `state` | string | State (2-letter) | Required, enum |
| `county` | string | County | Required |
| `zipCode` | string | ZIP code | Required, 5 or 9 digit |
| `webPage` | string | Business website | URL format |
| `congressionalDistrict` | string | Congressional district | Lookup from ZIP |
| `naicsCode` | string | NAICS industry code | 6-digit, validated |

### 4. Loan Characteristics (Checkboxes)

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `isPurchase` | boolean | Purchase transaction | false |
| `isConstruction` | boolean | Construction financing | false |
| `isEquipment` | boolean | Equipment only | false |
| `hasLifeInsurance` | boolean | Life insurance required | false |
| `isGroundLeased` | boolean | Ground lease property | false |
| `isFloodZone` | boolean | Property in flood zone | false |
| `isStartup` | boolean | Startup business (<2 yrs) | false |
| `isRefinance50` | boolean | Refinance >50% of project | false |
| `isRefinance` | boolean | Any refinance component | false |
| `isFranchise` | boolean | Franchise business | false |
| `franchiseName` | string | Franchise name (if applicable) | null |

### 5. Financial Structure

| Field | Type | Description | Calculation |
|-------|------|-------------|-------------|
| `totalProject` | currency | Total project cost | Manual/Calculated |
| `thirdParty1st` | currency | First lien amount | Manual |
| `netDebenture` | currency | SBA debenture (net) | Calculated |
| `interim` | currency | Interim loan amount | Manual |
| `borrowerDown` | currency | Borrower equity injection | `totalProject - thirdParty1st - netDebenture` |
| `grossDebenture` | currency | Gross debenture amount | `netDebenture + fees` |
| `originationFee` | currency | CDC origination fee | `netDebenture * rate` |
| `servicingFee` | currency | Servicing fee | `netDebenture * rate` |
| `closingFee` | currency | Closing costs | Manual |
| `sbaHalfPoint` | currency | SBA 1/2 point fee | `netDebenture * 0.005` |
| `halfPointDateReceived` | date | Date 1/2 point received | Manual |

### 6. Lender Information

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `firstLender` | string | First lien lender name | Lookup table |
| `interimLender` | string | Interim lender name | Lookup table |

### 7. Interest Rates

| Field | Type | Description | Range |
|-------|------|-------------|-------|
| `debentureRate` | decimal | SBA debenture rate | 0-15% |
| `cdcNoteRate` | decimal | CDC note rate | 0-15% |
| `firstNoteRate` | decimal | First lien rate | 0-15% |
| `firstLoanIndex` | string | Index for first lien | e.g., "Prime", "SOFR" |
| `interimLoanRate` | decimal | Interim financing rate | 0-20% |
| `interimLoanIndex` | string | Index for interim | e.g., "Prime + 1" |

### 8. Approval Workflow

| Field | Type | Description | Auto-set |
|-------|------|-------------|----------|
| `loanCommitteeApproval` | date | Internal committee approval | Manual |
| `presidentApproval` | date | CDC president approval | Manual |
| `boardRatify` | date | Board ratification date | Manual |
| `boardApproval` | date | Full board approval | Manual |
| `dateToSba` | date | Application sent to SBA | Manual |
| `authDate` | date | SBA authorization date | Manual |
| `authNumber` | string | SBA authorization number | Manual |

### 9. SBA 327 Forms (Closing Documents)

| Field | Type | Description |
|-------|------|-------------|
| `sba327_1` | date | 327-1 form date |
| `sba327_2` | date | 327-2 form date |
| `sba327_3` | date | 327-3 form date |
| `sba327_4` | date | 327-4 form date |

### 10. Environmental & Compliance

| Field | Type | Description |
|-------|------|-------------|
| `envDateApproved` | date | Environmental report approval |
| `envDateOfReport` | date | Environmental report date |
| `appDateApproved` | date | Appraisal approval date |
| `appDate` | date | Appraisal date |

### 11. Funding Milestones

| Field | Type | Description |
|-------|------|-------------|
| `bankRecordDate` | date | Bank recording date |
| `bankFundDate` | date | Bank funding date |
| `escrowCloseDate` | date | Escrow close date |
| `cdcSigningDate` | date | CDC closing/signing date |
| `cdcFundDate` | date | CDC funding date |
| `noticeOfCompletion` | date | Construction NOC date |
| `reconveyanceRecvdDate` | date | Reconveyance received |

### 12. UCC Filing

| Field | Type | Description |
|-------|------|-------------|
| `uccFilingDate` | date | Initial UCC filing |
| `uccContinuationFilingDate` | date | Continuation filing |
| `uccFilingNo` | string | UCC filing number |

### 13. Risk Assessment

| Field | Type | Description | Range |
|-------|------|-------------|-------|
| `loanRisk` | enum | Overall risk rating | Low/Medium/High |
| `applicationLoanRating` | integer | Application risk score | 1-5 |
| `servicingLoanRating` | integer | Servicing risk score | 1-5 |

### 14. Jobs Impact (SBA Requirement)

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `jobsBeforeProject` | integer | Jobs before SBA financing | >= 0 |
| `jobsCreated` | integer | Jobs created | >= 0 |
| `jobsRetained` | integer | Jobs retained | >= 0 |
| `jobs2YrsProjected` | integer | 2-year projected jobs | >= 0 |
| `jobs2YrsActual` | integer | Actual jobs at 2 years | >= 0, for servicing |

### 15. Insurance

| Field | Type | Description |
|-------|------|-------------|
| `insCoPolicyNo` | string | Insurance policy number |
| `insExpDate` | date | Policy expiration date |
| `insCoName` | string | Insurance company name |
| `insCoAgentName` | string | Insurance agent name |
| `insPhone` | string | Agent phone |
| `insFax` | string | Agent fax |
| `insEmail` | string | Agent email |

### 16. Servicing/Disposition

| Field | Type | Description |
|-------|------|-------------|
| `principleBalance` | currency | Current principal balance |
| `lastDatePaid` | date | Last payment date |
| `cancelledDate` | date | If cancelled |
| `liquidationDate` | date | If liquidated |
| `liquidationBalance` | currency | Balance at liquidation |
| `paidDate` | date | If paid in full |
| `chargeOffDate` | date | If charged off |
| `chargeOffBalance` | currency | Balance at charge-off |
| `shortSaleBalance` | currency | Balance at short sale |
| `lastSiteVisit` | date | Last site visit date |

---

## UI Implementation

### View 1: Deal Desk (Pipeline Focus)
Current implementation - enhance with quick-access to:
- Status progression
- Key dates (Auth Date, Fund Date)
- Financial summary

### View 2: Loan Detail Form
New tabbed interface matching the Access form:

```
[Borrower] [Property] [Structure] [Rates] [Approvals]
[Closing] [Insurance] [Servicing] [Documents]
```

### View 3: Approval Workflow (Kanban)
Visual pipeline from Committee through Funding

### View 4: Servicing Dashboard
For post-funding loan management

---

## API Endpoints

### Loan Management
```
GET    /api/loans                  # List all loans
GET    /api/loans/:id              # Get loan details
POST   /api/loans                  # Create new loan
PUT    /api/loans/:id              # Update loan
PATCH  /api/loans/:id/status       # Update status only
DELETE /api/loans/:id              # Archive loan
```

### Calculations
```
POST   /api/loans/calculate-structure   # Calculate loan structure
GET    /api/naics/:code                 # Validate/lookup NAICS
GET    /api/congressional-district/:zip # Get district from ZIP
```

---

## Implementation Phases

### Phase 1: Data Model (1 week)
- [ ] Extend Lead type with loan fields
- [ ] Create Loan TypeScript interface
- [ ] Update Cosmos DB schema
- [ ] Add seed data for testing

### Phase 2: Core UI (2 weeks)
- [ ] Create LoanDetailView component
- [ ] Implement tabbed form layout
- [ ] Add field validation
- [ ] Create approval workflow UI

### Phase 3: Calculations (1 week)
- [ ] Loan structure calculator
- [ ] Fee calculations
- [ ] NAICS/District lookups
- [ ] Auto-fill logic

### Phase 4: Servicing (1 week)
- [ ] Servicing dashboard
- [ ] Payment tracking
- [ ] Insurance renewal alerts
- [ ] Risk rating updates

### Phase 5: Reports (1 week)
- [ ] Pipeline reports
- [ ] SBA jobs impact reports
- [ ] Funding projections
- [ ] Export to Excel/PDF
