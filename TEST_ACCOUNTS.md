# 🔐 Test Account & Development Walkthrough

## Quick Start

| Field | Value |
|-------|-------|
| **Site Password** | `mazen` |
| **Email** | `MZwin@ampac.com` |
| **User Password** | `AmPac@504` |
| **Role** | `admin` (full access) |

---

## All Test Accounts by Role

All accounts use password: **`AmPac@504`**

### Admins (Full Access)
| Name | Email | Notes |
|------|-------|-------|
| Mazen Zwin | MZwin@ampac.com | Developer account |
| Hilda Kennedy | HKennedy@ampac.com | CEO |
| Brandon Sellers | BSellers@ampac.com | IT Admin |

### Managers (Team Oversight)
| Name | Email | Notes |
|------|-------|-------|
| Ed Ryan | ERyan@ampac.com | 504 Sales Director |
| Ahmed Zwin | AZwin@ampac.com | Programs Director |
| Janine Warren | JWarren@ampac.com | Integration Director |
| Nicole J. Jones | NJones@ampac.com | Innovation Director |

### Loan Officers
| Name | Email | Notes |
|------|-------|-------|
| Jaime Rodriguez | JRodriguez@ampac.com | SVP 504 Specialist |
| Erik Iwashika | EIwashika@ampac.com | VP 504 Specialist |
| Lucas Sceranka | LSceranka@ampac.com | VP 504 Specialist |
| Ronnie Sylvia | RSylvia@ampac.com | VP 504 Specialist |
| Mark Morales | MMorales@ampac.com | Community Lending |

### BDOs (Business Development)
| Name | Email | Notes |
|------|-------|-------|
| Brian Kennedy, Jr | BKennedy@ampac.com | Ecosystem Director |
| Jeff Sceranka | JSceranka@ampac.com | New Markets |
| Ian Aguilar | IAguilar@ampac.com | BD Associate |
| Hunter Bell | HBell@ampac.com | AVP BDO |

### Processors
| Name | Email | Notes |
|------|-------|-------|
| Jennifer Salazar | JSalazar@ampac.com | Senior Loan Admin |
| Kaiesha Davidson | KDavidson@ampac.com | Accountant |

### Underwriters
| Name | Email | Notes |
|------|-------|-------|
| Julie Silvio | JSilvio@ampac.com | Chief Credit Officer |

---

## Feature Testing Guide

### 1. Lead Management
1. Login with any account
2. Click **+ Add Lead** to create a new lead
3. Click on a lead card to open the detail modal
4. Test the tabs: **Deal Info**, **Documents**, **Notes**, **Bank Partners**, **Contacts**, **AI**

### 2. Document Checklist (LO Feature)
1. Open any lead detail
2. Go to **Documents** tab
3. See checklist based on program (504 = 16 docs, 7a = 10 docs)
4. Change status dropdown: Needed → Requested → Received
5. Click **Request Docs** to open SendNow portal

### 3. Bank Partner Tracking (LO Feature)
1. Open any lead detail
2. Go to **Bank Partners** tab
3. Click **+ Add Bank** → select from rolodex
4. Update status: Approached → Reviewing → Approved → Committed
5. Click **Edit Terms** to add loan amount, rate, term

### 4. Banker Rolodex
1. Click **🏦 Bankers** button in header
2. See 10 pre-seeded bankers with:
   - Trust score (★★★★★)
   - Total funded ($)
   - Contact info
   - Relationship notes
3. Click **+ Add Banker** to add a new contact
4. Edit/remove bankers as needed
5. Bankers persist in localStorage

### 5. Lead Scout (AI Lead Generation)
1. Click **🔍 Find Leads** in header
2. Enter search query: "machine shops in Riverside CA"
3. Select depth: Quick / Standard / Deep
4. Click **Search**
5. Results show with SBA fit assessment
6. Click **+ Add** to add lead to your pipeline

### 6. Pipeline View
1. Click **Pipeline** in the segmented control
2. Drag leads between columns
3. Each column = deal stage

---

## API Keys (Optional)

For real data in Lead Scout, add to `.env`:

```bash
VITE_GOOGLE_PLACES_API_KEY=your_google_key
VITE_YELP_API_KEY=your_yelp_key
VITE_OPENAI_API_KEY=your_openai_key
```

Without keys, Lead Scout uses demo mode with sample data.

---

## Local Development

```bash
# Start dev server
cd c:\Users\mzwin\leads\apps\client
npm run dev

# Build
npm run build

# The app runs at http://localhost:5173
```

---

## Data Persistence

All data is stored in browser localStorage:
- Leads: `leads_demo_data_v3_[email]`
- Bankers: `leads_bankers_v1`
- Session: `leads_current_user`

To reset data, clear localStorage in browser DevTools.
